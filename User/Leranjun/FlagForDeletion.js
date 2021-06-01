/*
FlagForDeletion.js
by User:Leranjun

Based on [[MediaWiki:Gadget-registerToDelete.js]]
*/
// <pre>
$(() => {
    var self = $("#p-cactions .menu ul");
    if (!self.find("li")[0] || $(".will2Be2Deleted")[0] || mw.config.get("wgUserGroups").indexOf("patroller") === -1) return;

    $("<a/>", {
        attr: {
            href: "#",
            title: "挂删本页[alt-shift-d]",
            accesskey: "d",
        },
        text: "挂删",
    })
        .on("click", async () => {
            if ($("#FlagForDeletion")[0]) {
                $("#FlagForDeletion").show();
                return;
            }

            await mw.loader.using(["oojs-ui-core", "oojs-ui-widgets"]);

            var body = $(document.body),
                wrapper = $("<div/>", {
                    css: {
                        position: "fixed",
                        top: "0",
                        left: "0",
                        height: "100vh",
                        width: "100vw",
                        color: "black",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                        "background-color": "rgba(255, 255, 255, 0.73)",
                        "z-index": "199",
                    },
                    id: "FlagForDeletion",
                }),
                fieldset = new OO.ui.FieldsetLayout({
                    label: "挂删",
                }),
                reasons = new OO.ui.DropdownInputWidget({
                    options: [
                        { optgroup: "所有页面的删除理由" },
                        { data: "立即删除", label: "方针规定的应当被直接删除的页面" },
                        { data: "无意义内容", label: "大部分内容属方针规定的无意义内容的页面" },
                        { data: "重复页面", label: "和已有页面重复或高度相似" },
                        { data: "错误命名", label: "错误命名" },
                        { data: "名字空间错误", label: "名字空间错误" },
                        { data: "繁简重定向", label: "繁简重定向" },
                        { data: "受损重定向", label: "受损重定向" },
                        { data: "双重重定向", label: "双重重定向" },
                        { data: "残留重定向", label: "存废处理过程中产生的残留重定向" },
                        { data: "不再使用", label: "不再使用" },
                        { optgroup: "所有页面的删除理由" },
                        { data: "不在收录范围", label: "不在收录范围" },
                        { data: "版权侵犯", label: "条目整体违反本站著作权方针" },
                        { data: "内容极少/质量极差", label: "内容极少/质量极差", disabled: true },
                        { optgroup: "萌娘百科/Help空间的删除理由" },
                        { data: "伪装方针、指引页面", label: "伪装为站点方针或指引的页面", disabled: true },
                        { data: "与共识相抵触", label: "与现行方针、指引或多数共识相抵触的页面", disabled: true },
                        { optgroup: "用户页及其子页面的删除理由" },
                        { data: "用户申请", label: "用户本人申请" },
                        { optgroup: "其他" },
                        { data: "", label: "其他" },
                    ],
                    value: "不再使用",
                }),
                details = new OO.ui.TextInputWidget(),
                isDB = new OO.ui.CheckboxInputWidget({
                    selected: true,
                }),
                submit = new OO.ui.ButtonWidget({
                    label: "确认",
                    flags: ["primary", "progressive"],
                }),
                cancel = new OO.ui.ButtonWidget({
                    label: "取消",
                    flags: "destructive",
                });
            fieldset.addItems([
                new OO.ui.FieldLayout(reasons, {
                    label: "挂删理由",
                    align: "top",
                }),
                new OO.ui.FieldLayout(details, {
                    label: "详情",
                    align: "top",
                }),

                new OO.ui.FieldLayout(isDB, {
                    label: "讨论版申请",
                    align: "inline",
                }),

                new OO.ui.FieldLayout(
                    new OO.ui.Widget({
                        content: [
                            new OO.ui.HorizontalLayout({
                                items: [submit, cancel],
                            }),
                        ],
                    })
                ),
            ]);
            wrapper.append(
                fieldset.$element.css({
                    width: "50%",
                    "max-width": "50em",
                    border: "thin solid black",
                    padding: "2em",
                    "border-radius": "10px",
                    "background-color": "#fff",
                })
            );
            body.append(wrapper);

            $(cancel.$element).click(() => wrapper.hide());

            $(submit.$element).click(async () => {
                var reason = reasons.getValue(),
                    detail = details.getValue();

                if (reason === null || detail === null) {
                    return;
                }
                if (reason && detail) {
                    reason += "：" + detail;
                } else {
                    reason = detail;
                }

                if (isDB.isSelected()) {
                    reason = "讨论版申请：" + reason;
                }

                submit.setDisabled(true);
                cancel.setDisabled(true);

                await mw.loader.using("mediawiki.api");

                var api = new mw.Api();
                try {
                    var d = await api.postWithToken("csrf", {
                        action: "edit",
                        format: "json",
                        title: mw.config.get("wgPageName"),
                        text: "<noinclude>{{即将删除|" + reason + "|user=" + mw.config.get("wgUserName") + "}}</noinclude>",
                        summary: "挂删：" + reason,
                        nocreate: true,
                        watchlist: "nochange",
                    });
                    if (d.error) {
                        throw new Error();
                    } else {
                        mw.notify("即将刷新……", {
                            title: "挂删成功",
                            type: "success",
                            tag: "FlagForDeletion",
                        });
                        window.setTimeout(() => window.location.reload(), 730);
                    }
                } catch (e) {
                    mw.notify("挂删时出现错误。", {
                        title: "挂删失败",
                        type: "error",
                        tag: "FlagForDeletion",
                    });
                    submit.setDisabled(false);
                    cancel.setDisabled(false);
                }
            });
        })
        .appendTo(
            $("<li/>", {
                attr: {
                    id: "ca-FlagForDeletion",
                },
            }).prependTo(self)
        );
});
// </pre>