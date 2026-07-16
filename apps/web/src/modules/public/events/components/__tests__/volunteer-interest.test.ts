import assert from "node:assert/strict";
import test from "node:test";
import { getAvailableVolunteerRoles } from "../VolunteerInterestSection";

test("only returns volunteer roles that still accept applications", () => {
	const roles = [
		{
			id: "open",
			recruitCount: 2,
			volunteerRole: {
				id: "role-1",
				name: "签到",
				description: "签到",
				cpPoints: 1,
			},
			registrations: [{ status: "APPROVED" as const }],
		},
		{
			id: "full",
			recruitCount: 1,
			volunteerRole: {
				id: "role-2",
				name: "摄影",
				description: "摄影",
				cpPoints: 1,
			},
			registrations: [{ status: "APPLIED" as const }],
		},
	];

	assert.deepEqual(
		getAvailableVolunteerRoles(roles).map((role) => role.id),
		["open"],
	);
});
