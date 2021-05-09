// <pre>
$(function() {
    var self = $('#p-cactions .menu ul');
    if (!self.find('li')[0] || $('.will2Be2Deleted')[0] || mw.config.get('wgUserGroups').indexOf('patroller') === -1) return;
    $('<a/>', {
        attr: {
            href: "#",
            title: "挂删本页[alt-shift-d]",
            accesskey: 'd'
        },
        text: '挂删'
    }).on('click', function() {
        var reason = prompt('挂删的理由【将会替换全文内容】\n【空白则使用默认理由（不在收录范围内或潜在价值较低）】\n【取消则不进行挂删】：'),
            self = $(this);
        if (reason === null) return;
        if (reason === '') reason = '不在收录范围内或潜在价值较低';
        var loadingBox = $('<div/>', {
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
            }).append('<img src="https://img.moegirl.org.cn/common/d/d1/Windows_10_loading.gif" style="height: 1em; margin-top: -.25em;">正在挂删中……'),
            reasonText = reason ? '|' + reason : '',
            api = new mw.Api();
        loadingBox.endOut = function endOut() {
            this.css('color', 'red').text('挂删失败……').delay(1000).queue(function() {
                $(this).css('opacity', '0').delay(730).queue(function() {
                    $(this).remove();
                    $(document.body).css('overflow', 'auto');
                    $(this).dequeue();
                });
                $(this).dequeue();
            });
        };
        $(document.body).append(loadingBox).css('overflow', 'hidden');
        api.postWithToken('csrf', {
            action: 'edit',
            format: 'json',
            title: mw.config.get('wgPageName'),
            text: '<noinclude>{{即将删除' + reasonText + '|user=' + mw.config.get("wgUserName") + '}}</noinclude>',
            summary: '挂删：' + reason,
            nocreate: true,
            watchlist: 'preferences'
        }).then(function(d) {
            if (d.error) return loadingBox.endOut();
            loadingBox.css('color', 'green').text('挂删成功！即将刷新……');
            window.setTimeout(function() {
                window.location.reload();
            }, 730)
        }, loadingBox.endOut.bind(loadingBox));
    }).appendTo($('<li/>', {
        attr: {
            id: 'ca-registerToDelete'
        }
    }).prependTo(self));
});
// </pre>