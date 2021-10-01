/* eslint-disable no-magic-numbers */
/* global mw */
"use strict";
$(() => (async () => {
    await mw.loader.using(["mw.Api", "mediawiki.Uri"]);
    const groupsKey = ["bureaucrat", "sysop", "patroller", "goodeditor", "honoredmaintainer", "bot"].reverse();
    const groupsStr = {
        bureaucrat: "政",
        sysop: "管",
        patroller: "巡",
        goodeditor: "优",
        honoredmaintainer: "荣",
        bot: "机",
    };
    let cache;
    try {
        cache = JSON.parse(localStorage.getItem("AnnTools-usergroup"));
        if (!$.isPlainObject(cache)
            || typeof cache.timestamp !== "number" || cache.timestamp < new Date().getTime() - 30 * 60 * 1000
            || !$.isPlainObject(cache.groups)) {
            cache = {};
        } else {
            for (const i of groupsKey) {
                if (!Array.isArray(cache.groups[i])) {
                    cache = {};
                    break;
                }
            }
        }
    } catch (e) {
        console.info("AnnTools-usergroup", e);
        cache = {};
    }
    localStorage.setItem("AnnTools-usergroup", JSON.stringify(cache));
    if (!$.isPlainObject(cache.groups)) {
        const api = new mw.Api();
        const result = await (async () => {
            const result = Object.fromEntries(groupsKey.map((n) => [n, []]));
            const eol = Symbol();
            let aufrom = undefined;
            while (aufrom !== eol) {
                const _result = await api.post({
                    action: "query",
                    list: "allusers",
                    augroup: groupsKey.join("|"),
                    aulimit: "max",
                    auprop: "groups",
                    aufrom,
                });
                if (_result.continue) {
                    aufrom = _result.continue.aufrom;
                } else {
                    aufrom = eol;
                }
                _result.query.allusers.forEach(({
                    name,
                    groups,
                }) => {
                    groups.forEach((group) => {
                        if (groupsKey.includes(group)) {
                            result[group] = result[group] || [];
                            if (!result[group].includes(name)) {
                                result[group].push(name);
                            }
                        }
                    });
                });
            }
            return result;
        })();
        cache.timestamp = new Date().getTime();
        cache.groups = result;
        localStorage.setItem("AnnTools-usergroup", JSON.stringify(cache));
    }
    $("a.mw-userlink").each((_, ele) => {
        const uri = new mw.Uri(ele.href);
        let username;
        const path = decodeURI(uri.path);
        if (/^\/User:[^/=%]+/.test(path)) {
            username = path.match(/^\/User:([^/=%]+)/)[1].replace(/_/g, " ");
        } else if (/^User:[^/=%]+/.test(uri.query.title)) {
            username = uri.query.title.match(/^User:([^/=%]+)/)[1].replace(/_/g, " ");
        }
        if (username) {
            const self = $(ele);
            groupsKey.forEach((group) => {
                if (cache.groups[group].includes(username)) {
                    self.after(`<sup class="markrights-${group}">${groupsStr[group]}<sup>`);
                }
            });
        }
    });
    $("body").append("<style>.markrights-bureaucrat{color:#66CCFF}.markrights-sysop{color:#FF7F50}.markrights-patroller{color:#DA70D6}.markrights-goodeditor{color:#FFB6C1}.markrights-honoredmaintainer{color:#FF5555}.markrights-bot{color:#40E0D0}sup[class^=markrights]+sup[class^=markrights]{margin-left:2px}</style>");
})());
//改自Ann姐，删除了萌百不必要显示的职位，修改了颜色。