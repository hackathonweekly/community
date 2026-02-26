# Developer Certificate of Origin

Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.

---

Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.

---

## 中文说明

DCO（Developer Certificate of Origin）是一种轻量级的贡献者声明机制，由 Linux 基金会制定，被 Linux 内核、Kubernetes 等大型开源项目广泛采用。

与 CLA（贡献者许可协议）相比，DCO 更加简单：

- 无需签署额外的法律文件
- 只需在 commit 时添加 `-s` 标志即可
- 表明你有权提交该贡献，且同意以项目许可证（MIT）发布

### 如何签署

```bash
git commit -s -m "feat: your feature description"
```

这会自动在 commit message 中添加：

```
Signed-off-by: Your Name <your.email@example.com>
```

### 配置 Git 信息

确保你的 Git 配置了正确的姓名和邮箱：

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```
