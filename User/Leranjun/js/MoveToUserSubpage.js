/*
 * MoveToUserSubpage.js
 * by User:Leranjun
 * Based on [[User:C8H17OH/moveToUserSubpage.js]]
 */
// <pre>
"use strict";
$(() => {
    const NS = [0, 10, 828];
    const pagens = mw.config.get("wgNamespaceNumber");
    const isModule = pagens === 828;
    const self = $("#p-cactions .menu ul");
    if (!self.find("li")[0] || $(".will2Be2Deleted")[0] || !mw.config.get("wgUserGroups").includes("patroller") && !mw.config.get("wgUserGroups").includes("sysop") || !NS.includes(pagens)) {
        return;
    }
    const isSysop = mw.config.get("wgUserGroups").includes("sysop");
    $("<a/>", {
        attr: {
            href: "#",
            title: isModule ? "移动至[[Module:Sandbox]]下创建者用户名页面子页面" : "移动至创建者用户页并挂删",
        },
        text: isModule ? "打回模块沙盒下创建者用户名页面" : "打回创建者用户页",
    }).on("click", async (e) => {
        e.preventDefault();
        if ($("#lr-mtus")[0]) {
            $("#lr-mtus").show();
            return;
        }
        const pageid = mw.config.get("wgArticleId");
        const pagename = mw.config.get("wgPageName");
        const convTemplate = function (str, name, val) {
            return str.replaceAll(`$${name}`, val);
        };
        const NOTIFTITLE = "提醒：请不要创建低质量页面";
        const NOTIFCONTENT = `您好，您最近创建的“${pagename}”页面由于质量不足，已移动至${isModule ? "[[Module:Sandbox]]下您的[[$2|用户名页面子页面]]" : "您的[[$2|用户页子页面]]"}下。请您以后避免在页面尚未达到最低质量标准的情况下直接在主名字空间创建。您可以待质量达到标准后再移动回主名字空间。感谢您的配合，祝您编辑愉快！`;
        await mw.loader.using(["oojs-ui-core", "oojs-ui-widgets", "oojs-ui-windows"]);
        const body = $(document.body);
        const wrapper = $("<div/>", {
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
        });
        const fieldset = new OO.ui.FieldsetLayout({
            label: isModule ? "打回模块沙盒下创建者用户名页面" : "打回创建者用户页",
        });
        const reasonBox = new OO.ui.TextInputWidget({
            value: (isModule ? "移动至[[Module:Sandbox]]下创建者用户名页面子页面" : "移动至创建者用户页") + (isSysop ? "，不留重定向" : "并挂删"),
        });
        const notifTitleBox = new OO.ui.TextInputWidget({
            value: NOTIFTITLE,
        });
        const notifContentBox = new OO.ui.MultilineTextInputWidget({
            value: NOTIFCONTENT,
            autosize: true,
        });
        const notNoticeBox = new OO.ui.CheckboxInputWidget();
        const watchBeforeBox = new OO.ui.CheckboxInputWidget();
        const watchAfterBox = new OO.ui.CheckboxInputWidget();
        const watchTalkBox = new OO.ui.CheckboxInputWidget({
            selected: true,
        });
        const submit = new OO.ui.ButtonWidget({
            label: "确认",
            flags: ["primary", "progressive"],
        });
        const cancel = new OO.ui.ButtonWidget({
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
            new OO.ui.FieldLayout(notNoticeBox, {
                label: "不在用户讨论页留下通知",
                align: "inline",
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
            new OO.ui.FieldLayout(new OO.ui.Widget({
                content: [
                    new OO.ui.HorizontalLayout({
                        items: [submit, cancel],
                    }),
                ],
            })),
        ]);
        wrapper.append(fieldset.$element.css({
            width: "50%",
            "max-width": "50em",
            border: "thin solid black",
            padding: "2em",
            "border-radius": "10px",
            "background-color": "#fff",
        }));
        body.append(wrapper);
        $(cancel.$element).on("click", () => {
            if (!cancel.isDisabled()) {
                wrapper.hide();
            }
        });
        $(submit.$element).on("click", async () => {
            if (submit.isDisabled()) {
                return;
            }
            const reason = reasonBox.getValue();
            const notifTitle = notifTitleBox.getValue();
            const notifContent = notifContentBox.getValue();
            const notNotice = notNoticeBox.isSelected();
            const watchBefore = watchBeforeBox.isSelected() ? "watch" : "nochange";
            const watchAfter = watchAfterBox.isSelected() ? "watch" : "nochange";
            const watchTalk = watchTalkBox.isSelected() ? "watch" : "nochange";
            submit.setDisabled(true);
            cancel.setDisabled(true);
            await mw.loader.using(["mediawiki.api", "mediawiki.notification", "mediawiki.notify"]);
            $("#mw-notification-area").appendTo(body);
            const api = new mw.Api();
            try {
                await mw.notify("正在查询贡献者数量……", {
                    title: "正在打回",
                    autoHide: false,
                    tag: "lr-mtus",
                });
                const contributorsApiResult = api.get({
                    action: "query",
                    prop: "contributors",
                    pageids: pageid,
                    pclimit: 2,
                });
                if (contributorsApiResult.error) {
                    throw new Error(contributorsApiResult.error.code);
                }
                if (contributorsApiResult.query.pages[pageid].contributors.length > 1) {
                    wrapper.hide();
                    if (!await OO.ui.confirm("贡献者并非只有创建者一人，请检查页面历史。确定打回创建者用户页？")) {
                        throw new Error("用户取消操作");
                    }
                    wrapper.show();
                }
                mw.notify("正在查询创建者用户名……", {
                    title: "正在打回",
                    autoHide: false,
                    tag: "lr-mtus",
                });
                const revisionsApiResult = api.get({
                    action: "query",
                    prop: "revisions",
                    titles: pagename,
                    rvprop: "user",
                    rvlimit: 1,
                    rvdir: "newer",
                });
                if (revisionsApiResult.error) {
                    throw new Error(revisionsApiResult.error.code);
                }
                const targetuser = revisionsApiResult.query.pages[pageid].revisions[0].user;
                const targetpage = isModule ? `Module:Sandbox/${targetuser}/${mw.config.get("wgTitle")}` : `User:${targetuser}/${pagename}`;
                // Step 3: Move the page
                mw.notify("正在移动页面……", {
                    title: "正在打回",
                    autoHide: false,
                    tag: "lr-mtus",
                });
                const moveApiResult = api.postWithToken("csrf", {
                    action: "move",
                    from: pagename,
                    to: targetpage,
                    movetalk: true,
                    movesubpages: true,
                    reason: reason,
                    noredirect: isSysop,
                    watchlist: watchAfter,
                    tags: "Automation tool",
                });
                if (moveApiResult.error) {
                    throw new Error(moveApiResult.error.code);
                }
                const str = [];
                if (!isModule && !isSysop) {
                    str.push("挂删");
                }
                if (!notNotice) {
                    str.push("留言");
                }
                if (str.length > 0) {
                    mw.notify(`正在${str.join("并")}……`, {
                        title: "正在打回",
                        autoHide: false,
                        tag: "lr-mtus",
                    });
                }
                const apiResults = Promise.allSettled([
                    isModule || isSysop ?
                        Promise.resolve() :
                        api.postWithToken("csrf", {
                            action: "edit",
                            format: "json",
                            title: pagename,
                            text: `<noinclude>{{即将删除|${reason}|user=${mw.config.get("wgUserName")}}}</noinclude>`,
                            summary: `挂删：${reason}`,
                            tags: "Automation tool",
                            nocreate: true,
                            watchlist: watchBefore,
                        }),
                    notNotice ?
                        Promise.resolve() :
                        api.postWithToken("csrf", {
                            action: "edit",
                            format: "json",
                            title: `User talk:${targetuser}`,
                            section: "new",
                            sectiontitle: notifTitle,
                            text: `${convTemplate(notifContent, "2", targetpage)}——~~~~`,
                            watchlist: watchTalk,
                            tags: "Automation tool",
                        }),
                ]);
                apiResults.forEach((r) => {
                    if (r.value && r.value.error) {
                        throw new Error(r.value.error.code);
                    }
                });
                mw.notify("即将刷新……", {
                    title: "打回成功",
                    type: "success",
                    tag: "lr-mtus",
                });
                window.setTimeout(() => {
                    window.location.reload();
                }, 730);
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
    }).appendTo($("<li/>", {
        attr: {
            id: "ca-lr-mtus",
        },
    }).prependTo(self));
});
// </pre>