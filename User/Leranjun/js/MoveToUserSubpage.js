/*
MoveToUserSubpage.js
by User:Leranjun
Based on [[User:C8H17OH/moveToUserSubpage.js]]
*/
/* jshint esversion: 8 */
// <pre>
(() => {
    const NS = window.lr_mtus_ns || [0, 10, 828];

    const pagens = mw.config.get("wgNamespaceNumber");

    const self = $("#p-cactions .menu ul");
    if (!self.find("li")[0] || $(".will2Be2Deleted")[0] || mw.config.get("wgUserGroups").indexOf("patroller") === -1 || !NS.includes(pagens)) return;

    $("<a/>", {
        attr: {
            href: "#",
            title: "移动至创建者用户页并挂删",
        },
        text: "增强型打回用户页",
    })
        .on("click", async (e) => {
            e.preventDefault();

            if ($("#lr-mtus")[0]) {
                $("#lr-mtus").show();
                return;
            }

            const pageid = mw.config.get("wgArticleId"),
                pagename = mw.config.get("wgPageName"),
                isModule = pagens === 828;

            const convTemplate = (str, name, val) => str.replaceAll("$" + name, val);
            // const convTemplate = (str, config) => {
            //     for (const key in config) {
            //         str.replaceAll("$" + key, config[key]);
            //     }
            //     return str;
            // };

            const NOTIFTITLE = convTemplate(window.lr_mtus_title || "提醒：请不要创建低质量页面", "1", pagename),
                NOTIFCONTENT = convTemplate(
                    window.lr_mtus_content ||
                        "注意到您最近创建的“$1”页面由于质量不足，已移动至您的[[$2|用户页子页面]]下。请您以后避免在页面尚未达到最低质量标准的情况下直接在主名字空间创建。您可以待质量达到标准后再移动回主名字空间。感谢您的配合。",
                    "1",
                    pagename
                );

            await mw.loader.using(["oojs-ui-core", "oojs-ui-widgets", "oojs-ui-windows"]);
            const body = $(document.body),
                wrapper = $("<div/>", {
                    css: {
                        position: "fixed",
                        top: 0,
                        left: 0,
                        height: "100%",
                        width: "100%",
                        color: "black",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                        "background-color": "rgba(255, 255, 255, 0.73)",
                        "z-index": 199,
                    },
                    id: "lr-mtus",
                }),
                fieldset = new OO.ui.FieldsetLayout({
                    label: "增强型打回用户页",
                }),
                reasonBox = new OO.ui.TextInputWidget({
                    value: "质量低下，移动回创建者用户子页面",
                }),
                notifTitleBox = new OO.ui.TextInputWidget({
                    value: NOTIFTITLE,
                }),
                notifContentBox = new OO.ui.MultilineTextInputWidget({
                    value: NOTIFCONTENT,
                }),
                watchBeforeBox = new OO.ui.CheckboxInputWidget(),
                watchAfterBox = new OO.ui.CheckboxInputWidget(),
                watchTalkBox = new OO.ui.CheckboxInputWidget({
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
                new OO.ui.FieldLayout(reasonBox, {
                    label: "打回理由",
                    align: "top",
                }),
                new OO.ui.FieldLayout(notifTitleBox, {
                    label: "通知标题",
                    align: "top",
                }),
                new OO.ui.FieldLayout(notifContentBox, {
                    label: "通知内容",
                    align: "top",
                }),
                new OO.ui.FieldLayout(watchBeforeBox, {
                    label: "监视移动前页面",
                    align: "inline",
                }),
                new OO.ui.FieldLayout(watchAfterBox, {
                    label: "监视移动后页面",
                    align: "inline",
                }),
                new OO.ui.FieldLayout(watchTalkBox, {
                    label: "监视创建者讨论页",
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
            $(cancel.$element).on("click", () => (cancel.isDisabled() ? null : wrapper.hide()));
            $(submit.$element).on("click", async () => {
                if (submit.isDisabled()) {
                    return;
                }

                const reason = reasonBox.getValue(),
                    notifTitle = notifTitleBox.getValue(),
                    notifContent = notifContentBox.getValue(),
                    watchBefore = watchBeforeBox.isSelected() ? "watch" : "nochange",
                    watchAfter = watchAfterBox.isSelected() ? "watch" : "nochange",
                    watchTalk = watchTalkBox.isSelected() ? "watch" : "nochange";

                submit.setDisabled(true);
                cancel.setDisabled(true);

                await mw.loader.using(["mediawiki.api", "mediawiki.notification", "mediawiki.notify"]);
                // Fix for notification stacking issue
                $("#mw-notification-area").appendTo(body);
                const api = new mw.Api();
                try {
                    // Step 1: Check # of contributors
                    await mw.notify("正在查询贡献者数量……", {
                        title: "正在打回",
                        autoHide: false,
                        tag: "lr-mtus",
                    });
                    let d = await api.get({
                        action: "query",
                        format: "json",
                        prop: "contributors",
                        pageids: pageid,
                        pclimit: 2,
                    });
                    if (d.error) {
                        throw new Error(d.error.code);
                    }
                    if (d.query.pages[pageid].contributors.length > 1) {
                        wrapper.hide();
                        if (!(await OO.ui.confirm("贡献者并非只有创建者一人，请检查页面历史。确定打回创建者用户页？"))) {
                            throw new Error("用户取消操作");
                        }
                        wrapper.show();
                    }

                    // Step 2: Get user name
                    mw.notify("正在查询创建者用户名……", {
                        title: "正在打回",
                        autoHide: false,
                        tag: "lr-mtus",
                    });
                    d = await api.get({
                        action: "query",
                        format: "json",
                        prop: "revisions",
                        titles: pagename,
                        rvprop: "user",
                        rvlimit: 1,
                        rvdir: "newer",
                    });
                    if (d.error) {
                        throw new Error(d.error.code);
                    }

                    const targetuser = d.query.pages[pageid].revisions[0].user,
                        targetpage = isModule ? `Module:Sandbox/${targetuser}/${mw.config.get("wgTitle")}` : `User:${targetuser}/${pagename}`;

                    // Step 3: Move the page
                    mw.notify("正在移动页面……", {
                        title: "正在打回",
                        autoHide: false,
                        tag: "lr-mtus",
                    });
                    d = await api.postWithToken("csrf", {
                        action: "move",
                        format: "json",
                        from: pagename,
                        to: targetpage,
                        movetalk: true,
                        movesubpages: true,
                        reason,
                        watchlist: watchAfter,
                    });
                    if (d.error) {
                        throw new Error(d.error.code);
                    }

                    mw.notify("正在挂删并留言……", {
                        title: "正在打回",
                        autoHide: false,
                        tag: "lr-mtus",
                    });
                    d = await Promise.allSettled([
                        isModule
                            ? new Promise((res) => {
                                  res();
                              })
                            : api.postWithToken("csrf", {
                                  action: "edit",
                                  format: "json",
                                  title: pagename,
                                  text: "<noinclude>{{即将删除|" + reason + "|user=" + mw.config.get("wgUserName") + "}}</noinclude>",
                                  summary: "挂删：" + reason,
                                  nocreate: true,
                                  watchlist: watchBefore,
                              }),
                        api.postWithToken("csrf", {
                            action: "edit",
                            format: "json",
                            title: `User talk:${targetuser}`,
                            section: "new",
                            sectiontitle: notifTitle,
                            text: `${convTemplate(notifContent, "2", targetpage)}--~~~~`,
                            watchlist: watchTalk,
                        }),
                    ]);
                    d.forEach((r) => {
                        if (r.value.error) {
                            throw new Error(r.value.error.code);
                        }
                    });

                    mw.notify("即将刷新……", {
                        title: "打回成功",
                        type: "success",
                        tag: "lr-mtus",
                    });
                    window.setTimeout(() => window.location.reload(), 730);
                } catch (e) {
                    mw.notify(["打回时出现错误：", $("<code />").text(e)], {
                        title: "打回失败",
                        type: "error",
                        tag: "lr-mtus",
                    });
                    submit.setDisabled(false);
                    cancel.setDisabled(false);
                }
            });
        })
        .appendTo(
            $("<li/>", {
                attr: {
                    id: "ca-lr-mtus",
                },
            }).prependTo(self)
        );
})();
// </pre>