/*
ScrollToBottom.js
Made with ♥ by User:Leranjun
Based on [[MediaWiki:Gadget-Backtotop.js]] by User:AnnAngela
*/
// <pre>
/* 前往底部 */
$(function() {
    var body = document.body,
        html = document.documentElement;
    var innerWidth = window.innerWidth;
    var scrollbarWidth;
    var targetH = $("#mw-content-text .mw-parser-output h2")[0] ?
        $("#mw-content-text .mw-parser-output h2").last().offset().top :
        $("#mw-content-text").offset().top + $("#mw-content-text").outerHeight();
    var limit = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight) - window.innerHeight;
    var bottomOffset =
        Math.max(parseFloat($("#heimu_toggle").css("bottom")) || 0, parseFloat($(".backToTop").first().css("bottom")) || 0) + 93 + "px"; // Offset based on heimu toggle and back-to-top button
    switch ("scroll") {
        case getComputedStyle(body).overflowY:
            scrollbarWidth = innerWidth - body.clientWidth;
            break;
        case getComputedStyle(html).overflowY:
            scrollbarWidth = innerWidth - html.clientWidth;
            break;
        default:
            var backup = body.style.overflowY;
            body.style.overflowY = "scroll";
            scrollbarWidth = innerWidth - body.clientWidth;
            body.style.overflowY = backup;
    }
    var btn = $("<div/>", {
        text: "前往底部",
        attr: {
            title: "前往底部",
            class: "backToTop", // Not a typo, too lazy to write CSS :P
            id: "ScrollToBottom",
        },
        css: {
            "user-select": "none",
            bottom: bottomOffset,
        },
        on: {
            click: function() {
                $("html, body").animate({
                        scrollTop: targetH,
                    },
                    120
                );
            },
        },
    }).appendTo(document.body);
    if (scrollbarWidth === 0) {
        btn.css("right", "20px"); // 修复新版 Chrome 的自动隐藏式滚动条导致的按钮被覆盖 chrome://flags/#overlay-scrollbars
    }
    $(window)
        .on("scroll", function() {
            $(document).scrollTop() < Math.floor(Math.min(targetH, limit)) ? btn.fadeIn() : btn.fadeOut();
        })
        .scroll();
});
// </pre>