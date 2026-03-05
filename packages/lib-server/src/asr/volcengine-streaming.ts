import { randomUUID } from "node:crypto";
import WebSocket, { type RawData } from "ws";
import {
	VOLC_MESSAGE_TYPES,
	buildVolcClientMessage,
	parseVolcServerMessage,
} from "./volcengine-protocol";

const VOLCENGINE_ASR_WS_URL =
	process.env.VOLCENGINE_ASR_WS_URL ??
	"wss://openspeech.bytedance.com/api/v3/sauc/bigmodel";

const VOLCENGINE_RESOURCE_ID =
	process.env.VOLCENGINE_RESOURCE_ID ?? "volc.bigasr.sauc.duration";

const AUDIO_CHUNK_SIZE = 3200;

interface VolcengineAsrConfig {
	audio: {
		format: "pcm";
		rate: 16000;
		bits: 16;
		channel: 1;
	};
	request: {
		model_name: "bigmodel";
		enable_nonstream: boolean;
		enable_itn: boolean;
		enable_punc: boolean;
		show_utterances: boolean;
		result_type: "full";
		end_window_size: number;
	};
}

function parseBooleanEnv(
	value: string | undefined,
	fallback: boolean,
): boolean {
	if (!value) return fallback;
	const normalized = value.trim().toLowerCase();
	if (["1", "true", "yes", "on"].includes(normalized)) return true;
	if (["0", "false", "no", "off"].includes(normalized)) return false;
	return fallback;
}

function parseWindowSize(value: string | undefined, fallback: number): number {
	if (!value) return fallback;
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.max(200, Math.min(10000, parsed));
}

function buildVolcengineAsrConfig(): VolcengineAsrConfig {
	return {
		audio: { format: "pcm", rate: 16000, bits: 16, channel: 1 },
		request: {
			model_name: "bigmodel",
			enable_nonstream: parseBooleanEnv(
				process.env.VOLCENGINE_ENABLE_NONSTREAM,
				true,
			),
			enable_itn: parseBooleanEnv(
				process.env.VOLCENGINE_ENABLE_ITN,
				true,
			),
			enable_punc: parseBooleanEnv(
				process.env.VOLCENGINE_ENABLE_PUNC,
				true,
			),
			show_utterances: parseBooleanEnv(
				process.env.VOLCENGINE_SHOW_UTTERANCES,
				true,
			),
			result_type: "full",
			end_window_size: parseWindowSize(
				process.env.VOLCENGINE_END_WINDOW_SIZE,
				800,
			),
		},
	};
}

function getVolcengineCredentials() {
	const appId = process.env.VOLCENGINE_APP_ID;
	const accessToken = process.env.VOLCENGINE_ACCESS_TOKEN;
	if (!appId || !accessToken) {
		throw new Error(
			"VOLCENGINE_APP_ID / VOLCENGINE_ACCESS_TOKEN 未配置，无法使用火山引擎流式识别",
		);
	}
	return { appId, accessToken };
}

function chunkAudioPcm(audioPcm: Buffer): Buffer[] {
	const chunks: Buffer[] = [];
	for (let offset = 0; offset < audioPcm.length; offset += AUDIO_CHUNK_SIZE) {
		chunks.push(audioPcm.subarray(offset, offset + AUDIO_CHUNK_SIZE));
	}
	return chunks;
}

function getTranscriptFromUtterances(utterances: unknown): string {
	if (!Array.isArray(utterances)) return "";
	const definiteText = utterances
		.filter(
			(u) =>
				typeof u === "object" &&
				u !== null &&
				Boolean((u as { definite?: unknown }).definite),
		)
		.map((u) => {
			const t = (u as { text?: unknown }).text;
			return typeof t === "string" ? t : "";
		})
		.join("");
	if (definiteText) return definiteText;
	return utterances
		.map((u) => {
			if (typeof u !== "object" || u === null) return "";
			const t = (u as { text?: unknown }).text;
			return typeof t === "string" ? t : "";
		})
		.join("");
}

function getTranscriptFromServerPayload(payload: unknown): string {
	if (typeof payload !== "object" || payload === null) return "";
	const result = (payload as { result?: unknown }).result;
	if (typeof result !== "object" || result === null) return "";
	const text = (result as { text?: unknown }).text;
	if (typeof text === "string" && text.trim()) return text;
	return getTranscriptFromUtterances(
		(result as { utterances?: unknown }).utterances,
	);
}

function normalizeRawData(raw: RawData): Buffer {
	if (Buffer.isBuffer(raw)) return raw;
	if (Array.isArray(raw)) return Buffer.concat(raw);
	return Buffer.from(raw);
}

export async function transcribeAudioPcmByVolcengine(
	audioPcm: Buffer,
): Promise<string> {
	if (audioPcm.length === 0) throw new Error("音频数据为空，无法识别");

	const { appId, accessToken } = getVolcengineCredentials();
	const requestConfig = buildVolcengineAsrConfig();

	return await new Promise<string>((resolve, reject) => {
		const ws = new WebSocket(VOLCENGINE_ASR_WS_URL, {
			headers: {
				"X-Api-App-Key": appId,
				"X-Api-Access-Key": accessToken,
				"X-Api-Resource-Id": VOLCENGINE_RESOURCE_ID,
				"X-Api-Connect-Id": randomUUID(),
			},
		});

		let settled = false;
		let latestTranscript = "";
		let serverErrorMessage: string | null = null;

		const settleReject = (error: Error) => {
			if (settled) return;
			settled = true;
			if (
				ws.readyState === WebSocket.OPEN ||
				ws.readyState === WebSocket.CONNECTING
			)
				ws.close();
			reject(error);
		};

		const settleResolve = (value: string) => {
			if (settled) return;
			settled = true;
			if (
				ws.readyState === WebSocket.OPEN ||
				ws.readyState === WebSocket.CONNECTING
			)
				ws.close();
			resolve(value);
		};

		ws.on("open", () => {
			ws.send(
				buildVolcClientMessage({
					messageType: VOLC_MESSAGE_TYPES.FULL_CLIENT_REQUEST,
					serialization: 0x1,
					compression: 0x0,
					payload: Buffer.from(JSON.stringify(requestConfig)),
				}),
			);

			for (const chunk of chunkAudioPcm(audioPcm)) {
				ws.send(
					buildVolcClientMessage({
						messageType:
							VOLC_MESSAGE_TYPES.AUDIO_ONLY_CLIENT_REQUEST,
						serialization: 0x0,
						compression: 0x0,
						payload: chunk,
					}),
				);
			}

			ws.send(
				buildVolcClientMessage({
					messageType: VOLC_MESSAGE_TYPES.AUDIO_ONLY_CLIENT_REQUEST,
					messageFlags: 0x2,
					serialization: 0x0,
					compression: 0x0,
					payload: Buffer.alloc(0),
				}),
			);
		});

		ws.on("message", (raw: RawData) => {
			try {
				const parsed = parseVolcServerMessage(normalizeRawData(raw));
				if ("errorCode" in parsed) {
					serverErrorMessage =
						parsed.errorMessage ||
						`ASR error: ${String(parsed.errorCode)}`;
					if (ws.readyState === WebSocket.OPEN) ws.close();
					return;
				}
				const transcript = getTranscriptFromServerPayload(parsed.json);
				if (transcript.trim()) latestTranscript = transcript;
			} catch (error) {
				settleReject(
					error instanceof Error
						? error
						: new Error("火山引擎返回格式解析失败"),
				);
			}
		});

		ws.on("error", (error: Error) => {
			settleReject(
				error instanceof Error ? error : new Error("火山引擎连接失败"),
			);
		});

		ws.on("close", (code: number, reason: Buffer) => {
			if (serverErrorMessage) {
				settleReject(new Error(serverErrorMessage));
				return;
			}
			if (latestTranscript.trim()) {
				settleResolve(latestTranscript.trim());
				return;
			}
			const closeReason = reason.toString();
			if (code === 1000 || code === 1005) {
				settleReject(new Error("火山引擎未返回有效识别结果"));
				return;
			}
			settleReject(
				new Error(
					`火山引擎连接中断（code: ${String(code)}${closeReason ? `, reason: ${closeReason}` : ""}）`,
				),
			);
		});
	});
}
