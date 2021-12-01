/* eslint-disable prefer-arrow-callback */
/* eslint-disable prefer-template */
/* eslint-disable comma-dangle */
/* eslint-disable no-var */
/* eslint dot-notation: ["error", { "allowPattern": "^(?:catch|default)$" } ] */
/* eslint-disable no-unused-vars */
/* eslint-disable no-redeclare */
/* global mw, $, OO, moment, Cron, prettyPrint, LocalObjectStorage, lazyload, wgULS */
/* eslint-enable no-unused-vars */
/* eslint-enable no-redeclare */
"use strict";
// <pre>
$(function () {
    var wgUserGroups = mw.config.get("wgUserGroups", []);
    if (!wgUserGroups.includes("sysop") && !wgUserGroups.includes("patroller")) {
        return;
    }
    mw.config.set({
        wgRollbacking: false,
        wgRollbackTool: "inited"
    });
    var possibleError = {
        alreadyrolled: wgULS("已被回退","已被還原"),
        onlyauthor: wgULS("该页面只有一位编辑者参与编辑，无法回退","該頁面只有一位編輯者參與編輯，無法還原"),
        missingparams: wgULS('必须要有参数"title"或参数"pageid"之一','必須存在參數"title"或參數"pageid"之一'),
        notitle: wgULS('参数"title"必须被设置','參數"title"必須被設置'),
        notoken: wgULS('参数"token"必须被设置','參數"token"必須被設置'),
        nouser: wgULS('参数"user"必须被设置','參數"user"必須被設置')
    };
    var loop = function (_, ele) {
        var self = $(ele);
        self.data("href", self.attr("href")).removeAttr("href") //取消拖动链接回退
            .attr("title", ele.title + "（启用自定义摘要）").css("cursor", "pointer").append("<sup>+</sup>");
        if ($(".ns-special")[0] && self.text().includes("10")) {
            self.parent().text( wgULS("[超过10次的编辑]","[超過10次的編輯]") ).attr("title", "超过10次的编辑请使用撤销功能，以便检查差异（自定义摘要小工具）");
        }
        ele.onmouseover = $.noop;
        ele.onmouseout = $.noop;
        ele.onmousedown = $.noop;
    };
    var exit = function () {
        var rbcount = $("#rbcount");
        var count = 3;
        setInterval(function () {
            if (--count === 0) {
                window.location.reload();
            }
            rbcount.text(count > 0 ? count : "0");
        }, 1000);
    };
    $(".mw-rollback-link a").each(loop);
    var api = new mw.Api();
    $(document.body).on("click", function (event) {
        var target = event.target;
        if (!$(target).is(".mw-rollback-link a")) {
            return true;
        }
        var self = $(target);
        var parent = self.parent();
        if (!self.data("href")) {
            loop(null, target);
        }
        if (!parent.find(self)[0]) {
            return false;
        }
        if (mw.config.get("wgRollbacking")) {
            return false;
        }
        var rollbackSummary = prompt( wgULS("回退操作的编辑摘要","還原操作的編輯摘要") + "【xxx//Rollback】\n【" + wgULS("空白则使用默认回退摘要","留空則使用默認的還原摘要") + "】\n【" + wgULS("取消则不进行回退","取消則不進行還原") + "】：");
        if (rollbackSummary !== null) {
            var uri = new mw.Uri(self.data("href"));
            self.replaceWith('<span id="rbing"><img src="https://img.moegirl.org.cn/common/d/d1/Windows_10_loading.gif" style="height: 1em; margin-top: -.25em;">' + wgULS('正在回退中','正在還原') + '……</span>');
            var rbing = $("#rbing");
            $(".mw-rollback-link a").not(rbing).css({
                color: "#aaa",
                "text-decoration": "none",
            });
            mw.config.set("wgRollbacking", true);
            api.post({
                title: uri.query.title,
                user: uri.query.from,
                summary: rollbackSummary ? rollbackSummary + " //Rollback" : "//Rollback",
                token: uri.query.token,
                action: "rollback",
                format: "json",
            }).then(function () {
                rbing.css("color", "green").html( "成功！" + wgULS("将在","將在") + '<span id="rbcount">3</span>秒' + wgULS("内刷新","內重新整理"));
                exit();
            }, function (e) {
                var errorText = e instanceof Error ? e + " " + e.stack.split("\n")[1].trim() : $.isPlainObject(e) ? JSON.stringify(e) : typeof e === "string" && e in possibleError ? possibleError[e] : e + "";
                rbing.css("color", "red").html( wgULS("错误：","錯誤：") + errorText + wgULS("。将在","。將在") + '<span id="rbcount">3</span>' + wgULS("秒内刷新","秒內重新整理"));
                exit();
            });
        }
        return false;
    });
    new Image().src = "https://img.moegirl.org.cn/common/d/d1/Windows_10_loading.gif";
});
// </pre>