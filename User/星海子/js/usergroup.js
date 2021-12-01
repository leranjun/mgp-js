/* eslint-disable no-magic-numbers */
/* global mw */
/*
1.默认提供bureaucrat、sysop、patroller、goodeditor、honoredmaintainer、widgeteditor、bot用户组的显示，
  其中，widgeteditor为默认关闭显示
2.默认提供的用户组已支持zh-hant/zh-tw/zh-hk界面语言下显示繁体。
3.提供4个用户组开关（window.UserGroup_Maintain、window.UserGroup_Tech、window.UserGroup_Honor、window.UserGroup_Bot），可在个人JS使用。
  技术类用户组默认不显示，可通过添加 window.UserGroup_Tech = true 显示； 
  以关闭机器用户组为例，添加以下代码至[[Special:Mypage/vector.js]]： window.UserGroup_Bot = false；
4.已支持覆盖默认用户组文字和颜色，支持自定义显示本站所有其他非自动用户组，可通过个人CSS修改。
  以显示深红色的监督员为例，添加以下代码至[[Special:Mypage/vector.css]]： .markrights-suppress:after{color:darkred;content:"监"}
*/
"use strict";
$(() => (async () => {
	await mw.loader.using(["mediawiki.api", "mediawiki.Uri"]);
	const groupsKey = ["staff",
		"bureaucrat", "checkuser", "suppress", "sysop", "patroller", 
		"goodeditor", "honoredmaintainer", "VIP" , 
		"developer" , "widgeteditor" ,
		"bot" ,].reverse();
	const groupsStr = { staff: "",
		bureaucrat:"", checkuser:"", suppress:"", sysop:"", patroller:"", 
		goodeditor:"", honoredmaintainer:"", VIP:"",
		developer:"", widgeteditor:"",
		bot:"" ,};
	let cache;
	try {
		cache = JSON.parse(localStorage.getItem("Moegirl-UserGroup"));
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
		console.info("Moegirl-UserGroup", e);
		cache = {};
	}
	localStorage.setItem("Moegirl-UserGroup", JSON.stringify(cache));
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
		localStorage.setItem("Moegirl-UserGroup", JSON.stringify(cache));
	}
	$("a.mw-userlink").each((_, ele) => {
		const uri = new mw.Uri(ele.href);
		let username;
		const path = decodeURI(uri.path);
		if (/^\/User:[^/=%]+/.test(path)) {
			username = path.match(/^\/User:([^/=%]+)/)[1].replace(/_/g, " ");
		} else if (/^User:[^/=%]+/.test(uri.query.title)) {
			username = uri.query.title.match(/^User:([^/=%]+)/)[1].replace(/_/g, " ").replace(/%(?!\d+)/g, '%25');
		}
		if (username) {
			const self = $(ele);
			groupsKey.forEach((group) => {
				if (cache.groups[group].includes(username)) {
					self.after(`<sup class="markrights-${group}">${groupsStr[group]}</sup>`);
				}
			});
		}
	});

	if ( window.UserGroup_Maintain ??= true ){
		$("body").append('<style>'+
		'.markrights-bureaucrat:after{color:#66CCFF;content:"政"}' +
		'.markrights-sysop:after{color:#FF7F50;content:"管"}' +
		'.markrights-patroller:after{color:#DA70D6;content:"巡"}' +
		'</style>');
	}

	if ( window.UserGroup_Honor ??= true ){
		$("body").append('<style>'+
		'.markrights-goodeditor:after{color:#FFB6C1;content:"优"}' +
		'.markrights-goodeditor:lang(zh-hant):after,.markrights-goodeditor:lang(zh-tw):after,.markrights-goodeditor:lang(zh-hk):after{color:#FFB6C1;content:"優"}' +
		'.markrights-honoredmaintainer:after{color:#FF5555;content:"荣"}' +
		'</style>');
	}

	if ( window.UserGroup_Tech ??= false ){
		$("body").append('<style>'+
		'.markrights-widgeteditor:after{color:skyblue;content:"部"}' +
		'</style>');
	}

	if ( window.UserGroup_Bot ??= true ){
		$("body").append('<style>'+
		'.markrights-bot:after{color:#40E0D0;content:"机"}' +
		'.markrights-bot:lang(zh-hant):after,.markrights-bot:lang(zh-tw):after,.markrights-bot:lang(zh-hk):after{color:#40E0D0;content:"機"}' +
		'</style>');
	}

})());