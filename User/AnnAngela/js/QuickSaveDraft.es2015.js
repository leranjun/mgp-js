/* eslint-disable no-magic-numbers */
/* global mw */
/* jshint ignore:start */
// <pre>
"use strict";
try {
    const statesMap = {
        0: "尚未发出请求",
        1: "已发出请求但未收到数据",
        2: "已收到 header",
        3: "接收数据中",
        4: "数据接收完成",
    };
    (async () => {
        const userId = mw.config.get("wgUserId");
        if (typeof userId !== "number" || !/^\d+$/.test("" + userId) || userId <= 0) {
            return;
        }
        if (!["edit", "submit"].includes(mw.config.get("wgAction"))) {
            return;
        }
        let style;
        try {
            style = await $.ajax({
                url: `${mw.config.get("wgServer")}${mw.config.get("wgScriptPath")}/User:AnnAngela/css/QuickSaveDraft.main.css?action=raw&ctype=text/css`,
                type: "GET",
                cache: true,
            });
        } catch (e) {
            throw new Error(`无法加载 CSS：\n    加载进度：${statesMap[e.readyState]}\n    服务器返回代码：${e.status}${e.statusText === "error" ? "" : `（${e.statusText}）`}`);
        }
        class DraftStorage {
            constructor(userId) {
                const legalKeys = ["timerInterval", "drafts"];
                this.userId = userId;
                let data;
                try {
                    data = JSON.parse(localStorage.getItem("AnnTools-QuickSaveDraft"));
                } catch (_) {
                    console.debug(_);
                }
                let setBackFlag = false;
                if (!$.isPlainObject(data)) {
                    data = {};
                    setBackFlag = true;
                }
                if (!data[userId]) {
                    data[userId] = {};
                    setBackFlag = true;
                }
                Object.keys(data).forEach((uId) => {
                    const uData = data[uId];
                    if (typeof uData.timerInterval !== "number" || !/^\d+$/.test("" + uData.timerInterval) || uData.timerInterval <= 0) {
                        uData.timerInterval = 3;
                        setBackFlag = true;
                    }
                    if (!$.isPlainObject(uData.drafts)) {
                        uData.drafts = {};
                        setBackFlag = true;
                    }
                    Object.keys(uData.drafts).forEach((pagename) => {
                        if (!$.isPlainObject(uData.drafts[pagename])) {
                            delete uData.drafts[pagename];
                            setBackFlag = true;
                            return;
                        }
                        Object.keys(uData.drafts[pagename]).forEach((section) => {
                            if (!$.isPlainObject(uData.drafts[pagename][section])
                                || typeof uData.drafts[pagename][section].timestamp !== "number" || !/^\d+$/.test("" + uData.drafts[pagename][section].timestamp) || uData.drafts[pagename][section].timestamp <= 0
                                || typeof uData.drafts[pagename][section].draft !== "string") {
                                delete uData.drafts[pagename][section];
                                setBackFlag = true;
                                return;
                            }
                        });
                    });
                    Object.keys(uData).forEach((key) => {
                        if (!legalKeys.includes(key)) {
                            delete uData[key];
                            setBackFlag = true;
                        }
                    });
                });
                this.data = data;
                if (setBackFlag) {
                    this.setData();
                }
            }
            setData() {
                localStorage.setItem("AnnTools-QuickSaveDraft", JSON.stringify(this.data));
            }
            getTimerInterval() {
                return this.data[this.userId].timerInterval;
            }
            setTimerInterval(interval) {
                if (this.data[this.userId].timerInterval !== interval) {
                    this.data[this.userId].timerInterval = interval;
                    this.setData();
                }
            }
            getDraft(pagename, section) {
                return $.isPlainObject(this.data[this.userId].drafts[pagename]) && $.isPlainObject(this.data[this.userId].drafts[pagename][section]) ? this.data[this.userId].drafts[pagename][section].draft : null;
            }
            setDraft(pagename, section, text) {
                if (!$.isPlainObject(this.data[this.userId].drafts[pagename])) {
                    this.data[this.userId].drafts[pagename] = {};
                }
                if (!$.isPlainObject(this.data[this.userId].drafts[pagename][section])) {
                    this.data[this.userId].drafts[pagename][section] = {};
                }
                this.data[this.userId].drafts[pagename][section].timestamp = new Date().getTime();
                this.data[this.userId].drafts[pagename][section].draft = text;
                this.setData();
            }
            getTimestamp(pagename, section) {
                return $.isPlainObject(this.data[this.userId].drafts[pagename]) && $.isPlainObject(this.data[this.userId].drafts[pagename][section]) ? this.data[this.userId].drafts[pagename][section].timestamp : null;
            }
        }
        class IntervalRegistry {
            constructor() {
                this.intervalRegistry = {};
                const date = new Date();
                const now = date.getTime();
                date.setMilliseconds(0);
                date.setSeconds(date.getSeconds() + 1);
                setTimeout(() => {
                    this.runInterval();
                    setInterval(() => {
                        this.runInterval();
                    }, 1000);
                }, date.getTime() - now);
            }
            register(denominator, ...callbacks) {
                const key = denominator + "";
                const index = +(Math.random() + "").replace(/^.*?(\d+)$/, "$1");
                if (!this.intervalRegistry[key]) {
                    this.intervalRegistry[key] = [];
                }
                const callback1 = callbacks[0];
                let callback;
                if (Array.isArray(callback1)) {
                    callback = callback1;
                }
                else {
                    callback = callbacks;
                }
                callback.forEach((cb) => {
                    this.intervalRegistry[key].push({ func: cb, index });
                });
                return index;
            }
            unregister(denominator, index) {
                let result = false;
                if (!index) {
                    const idx = denominator;
                    Object.keys(this.intervalRegistry).forEach((key) => {
                        if (this.deleteFunction(this.intervalRegistry[key], idx)) {
                            result = true;
                        }
                    });
                }
                else if (this.deleteFunction(this.intervalRegistry[denominator], index)) {
                    result = true;
                }
                return result;
            }
            deleteFunction(registry, index) {
                for (const reg of registry) {
                    if (reg.index === index || reg.func === index) {
                        registry.splice(registry.indexOf(reg), 1);
                        return true;
                    }
                }
                return false;
            }
            runInterval() {
                const now = Math.round(Date.now() / 1000);
                Object.keys(this.intervalRegistry).forEach((key) => {
                    if (now % +key === 0) {
                        this.intervalRegistry[key].forEach((reg) => {
                            reg.func();
                        });
                    }
                });
            }
        }
        jQuery.fn.extend({
            disable() {
                return this.each((_, ele) => {
                    if (!$(ele).is("input,button")) { return; }
                    if ($(ele).parent().hasClass("oo-ui-widget-enabled")) { $(ele).parent().toggleClass("oo-ui-widget-enabled oo-ui-widget-disabled"); }
                    ele.disabled = true;
                });
            },
            enable() {
                return this.each((_, ele) => {
                    if (!$(ele).is("input,button")) { return; }
                    if ($(ele).parent().hasClass("oo-ui-widget-disabled")) { $(ele).parent().toggleClass("oo-ui-widget-enabled oo-ui-widget-disabled"); }
                    ele.disabled = false;
                });
            },
        });
        const draftStorage = new DraftStorage(userId);
        const pagename = mw.config.get("wgPageName");
        const section = $('[name="wpSection"]').val() || "（-1）全文";
        const textarea = $("#wpTextbox1");
        const buttonArea = $("<div/>", {
            css: {
                "margin-top": ".5em",
            },
        }).appendTo("#editform .editButtons");
        const saveButton = inputConstruct({
            "class": "QuickSaveDraftSaveButton",
            val: "立即保存草稿",
            attr: {
                type: "button",
            },
        });
        const recoverButton = inputConstruct({
            "class": "QuickSaveDraftRecoverButton",
            val: "暂无草稿",
            attr: {
                type: "button",
            },
        });
        const rollbackButton = inputConstruct({
            "class": "QuickSaveDraftRollbackButton",
            val: "回退还原",
            attr: {
                type: "button",
            },
        });
        const timerInput = inputConstruct({
            "class": "QuickSaveDraftTimerInput",
            val: draftStorage.getTimerInterval(), //默认值
            maxlength: 2,
        });
        const timerSave = $("<span/>", {
            id: "QuickSaveDraftTimerSave",
        });
        const lastRun = $("<div/>", {
            "class": "QuickSaveDraftLastRunDiv",
            text: "上次草稿保存于",
        }).append($("<span/>", {
            "class": "QuickSaveDraftLastRun",
        })).append($("<span/>", {
            "class": "QuickSaveDraftSame",
            text: "，草稿内容与当前编辑内容一致",
        }));
        const pasueButton = inputConstruct({
            "class": "QuickSaveDraftPauseButton",
            val: "点击暂停自动保存",
            attr: {
                type: "button",
            },
        });
        function inputConstruct(opt) {
            const r = $("<span/>");
            const input = $("<input/>", opt);
            if (opt.attr && opt.attr.type === "button") {
                r.addClass("oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-buttonElement oo-ui-buttonElement-framed oo-ui-labelElement oo-ui-buttonInputWidget");
                input.addClass("oo-ui-inputWidget-input oo-ui-buttonElement-button");
            } else {
                r.addClass("oo-ui-widget oo-ui-widget-enabled oo-ui-inputWidget oo-ui-textInputWidget oo-ui-textInputWidget-type-text QuickSaveDraftTimer");
                input.addClass("oo-ui-inputWidget-input");
            }
            r.append(input);
            ["on", "val", "disable", "enable"].forEach((key) => {
                r[key] = input[key].bind(input);
            });
            return r;
        }
        function complement(_n, l) {
            const n = _n + "";
            if (n.length >= l) {
                return n;
            }
            const b = '<span style="speak:none;visibility:hidden;color:transparent;">';
            let c = "";
            while (l > (n + c).length) {
                c += "0";
            }
            return `${b + c}</span>${n}`;
        }
        function check() {
            if (draftStorage.getDraft(pagename, section) === undefined) {
                return;
            }
            const draft = draftStorage.getDraft(pagename, section);
            if (draft === null) //检测是否同一章节
            {
                return recoverButton.disable().val("暂无草稿");
            }
            if (draft !== textarea.val()) {
                //检测草稿是否一致
                recoverButton.enable().val("立即还原草稿");
                lastRun.find(".QuickSaveDraftSame").fadeOut();
            } else {
                recoverButton.disable().val("草稿内容一致");
                lastRun.find(".QuickSaveDraftSame").fadeIn();
            }
        }
        function save() {
            const date = new Date(),
                value = textarea.val();
            draftStorage.setDraft(pagename, section, value);
            check();
            lastRun.fadeIn().find(".QuickSaveDraftLastRun").html(`今日${complement(date.getHours(), 2)}时${complement(date.getMinutes(), 2)}分，草稿长度为 ${draftStorage.getDraft(pagename, section).length || "-1（暂无）"} 字符`);
        }
        let originText = null;
        let pause = false;
        let pastTime = 0;
        let timerSaveCode;
        recoverButton.disable();
        rollbackButton.disable();
        buttonArea.append(saveButton).append(recoverButton).append(rollbackButton).append("每隔").append(timerInput).append("分钟保存一次").append(timerSave).append(pasueButton).append(lastRun);
        const timestamp = draftStorage.getTimestamp(pagename, section);
        const date = new Date(timestamp);
        if (timestamp) {
            lastRun.fadeIn().find(".QuickSaveDraftLastRun").html(`${date.getDate() === new Date().getDate() ? "今" : complement(date.getDate(), 2)}日${complement(date.getHours(), 2)}时${complement(date.getMinutes(), 2)}分，草稿长度为 ${draftStorage.getDraft(pagename, section).length || "-1（暂无）"} 字符`);
        }
        textarea.on("input change", function () {
            check();
        });
        timerInput.on("input", () => {
            let flag = false;
            const input = timerInput.val();
            if (/^\d+$/.test(input) && +input > 0) {
                flag = true;
                draftStorage.setTimerInterval(+input);
            }
            const result = flag ? "，保存成功！" : "，保存失败";
            timerSave.text(result);
            timerSave.removeClass("disapper");
            if (timerSaveCode) {
                window.clearTimeout(timerSaveCode);
            }
            timerSaveCode = window.setTimeout(() => {
                timerSave.addClass("disapper");
            }, 3000);
        });
        rollbackButton.on("click", () => {
            if (rollbackButton.is(":disabled") || originText === null) {
                return;
            }
            textarea.val(originText);
            originText = null;
            rollbackButton.disable();
            check();
            return false;
        });
        recoverButton.on("click", () => {
            if (recoverButton.is(":disabled")) {
                return;
            }
            const draft = draftStorage.getDraft(pagename, section);
            if (draft === null) {
                return;
            }
            originText = textarea.val();
            textarea.val(draft);
            rollbackButton.enable();
            check();
            return false;
        });
        saveButton.on("click", () => {
            if (saveButton.is(":disabled")) {
                return;
            }
            save(false);
            return false;
        });
        pasueButton.on("click", () => {
            if (pause) {
                pasueButton.val("点击暂停自动保存");
                pause = false;
            } else {
                pasueButton.val("点击继续自动保存");
                pause = true;
            }
        });
        $("<style/>", {
            text: style,
        }).appendTo(document.head);
        const intervalRegistry = new IntervalRegistry();
        intervalRegistry.register(60, () => {
            if (pause) {
                return;
            }
            const interval = draftStorage.getTimerInterval();
            if (pastTime >= interval) {
                save();
                pastTime = 0;
            } else {
                pastTime++;
            }
        });
    })();
} catch (e) {
    $("#editButtons").append(`<p>草稿工具 3.0-alpha 出现问题：[${e.name}]${e.message}`);
}
// </pre>