// 巡查用小工具，对于主空间和模板空间页面，在右上角【更多】中添加【打回用户页】，当条目贡献者不只一人时有额外提示。修改自[[MediaWiki:Gadget-registerToDelete.js]]。
// 使用方法：在[[Special:我的用户页/common.js]]中添加一行：mw.loader.load('https://zh.moegirl.org.cn/index.php?title=User:C8H17OH/moveToUserSubpage.js&action=raw&ctype=text/javascript');

$(function() {
    var self = $('#p-cactions .menu ul');
    if (!self.find('li')[0] || $('.willBeDeleted')[0]
    	|| mw.config.get('wgUserGroups').indexOf('patroller') === -1
    	|| (mw.config.get('wgNamespaceNumber') !== 0 // main
    	    && mw.config.get('wgNamespaceNumber') != 10 // Template
    	    && mw.config.get('wgNamespaceNumber') != 828) // Module
    	) return;
    $('<a/>', {
        attr: {
            href: "#",
            title: "移动到创建者的用户子页并挂删[alt-shift-m]",
            accesskey: 'm'
        },
        text: '打回用户页'
    }).on('click', function() {
        var api = new mw.Api(),
            loadingBox = $('<div/>', {
                css: {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    height: '100vh',
                    width: '100vw',
                    transition: 'opacity .73s linear',
                    color: 'black',
                    'padding-top': '49vh',
                    'background-color': 'rgba(255,255,255,0.73)',
                    'text-align': 'center'
                }
            }).append('<img src="https://static.mengniang.org/common/d/d1/Windows_10_loading.gif" style="height: 1em; margin-top: -.25em;">正在打回中……'),
            reason;
        loadingBox.endOut = function endOut() {
            this.css('color', 'red').text('打回失败……').delay(1000).queue(function() {
                $(this).css('opacity', '0').delay(730).queue(function() {
                    $(this).remove();
                    $(document.body).css('overflow', 'auto');
                    $(this).dequeue();
                });
                $(this).dequeue();
            });
        };
            
        api.get({
            action: 'query',
            format: 'json',
            prop: 'contributors',
            titles: mw.config.get('wgPageName')
        }).then(function(d) {
        	// console.log("get contributors done");
            if (d.error) {
                alert('查询贡献信息失败！');
                return;
            }
            if (d.query.pages[mw.config.get('wgArticleId')].contributors.length != 1 && confirm('贡献者并非只有创建者一人，请检查页面历史。确定打回创建者用户页？') === false) return;

            var default_reason = '不在收录范围内或潜在价值较低';
            reason = prompt('打回用户页的理由【将会作为移动原因和挂删理由】\n【空白则使用默认理由（' + default_reason + '）】\n【取消则不进行打回】：');
            if (reason === null) return;
            if (reason === '') reason = default_reason;

            $(document.body).append(loadingBox).css('overflow', 'hidden');
            return api.get({
                action: 'query',
                format: 'json',
                prop: 'revisions',
                titles: mw.config.get('wgPageName'),
                rvprop: 'ids|user',
                rvlimit: 1,
                rvdir: 'newer'
            });
        }, loadingBox.endOut.bind(loadingBox)).then(function(d) {
        	// console.log("query revisions done");
            if (d.error) return loadingBox.endOut();
            if (mw.config.get('wgNamespaceNumber') == 828) { // Module
            	moveto = "模块:Sandbox/" + d.query.pages[mw.config.get('wgArticleId')].revisions[0].user + "/" + mw.config.get('wgTitle');
            } else { // main or Template
            	moveto = 'User:' + d.query.pages[mw.config.get('wgArticleId')].revisions[0].user + '/' + mw.config.get('wgPageName');
            }
            return api.postWithToken('csrf', {
                action: 'move',
                format: 'json',
                from: mw.config.get('wgPageName'),
                to: moveto,
                movetalk: true,
                movesubpages: true,
                reason: reason,
                watchlist: 'preferences'
            });
        }, loadingBox.endOut.bind(loadingBox)).then(function(d) {
        	// console.log("move done");
            if (d.error) return loadingBox.endOut();
            var reasonText = reason ? '|' + reason : '';
            return api.postWithToken('csrf', {
                action: 'edit',
                format: 'json',
                title: mw.config.get('wgPageName'),
                text: '<noinclude>{{即将删除' + reasonText + '|user=' + mw.config.get("wgUserName") + '}}</noinclude>',
                summary: '挂删：' + reason,
                nocreate: true,
                watchlist: 'preferences'
            });
        }, loadingBox.endOut.bind(loadingBox)).then(function(d) {
        	// console.log("register_to_delete done");
            if (d.error) return loadingBox.endOut();
            loadingBox.css('color', 'green').text('打回成功！即将刷新……');
            window.setTimeout(function() {
                window.location.reload();
            }, 730);
        }, loadingBox.endOut.bind(loadingBox));
    }).appendTo($('<li/>', {
        attr: {
            id: 'ca-moveToUserSubpage'
        }
    }).prependTo(self));
});