/**
 * Created by lenovo on 2017/11/11.
 */
(function(){
    var SuperEditor = function(){
        var view,fileName,isDirty = false,//isDirty 文档是否被修改 默认false，没有修改
            unsavedMsg = 'Unsaved changes will be lost. Are you sure?',
            unsavedTitle = 'Discard changes';
        var markDirty = function(){
            isDirty = true;
        };
        var markClean = function(){
            isDirty = false;
        };
        var checkDirty = function(){
            if(isDirty){return unsavedMsg;}
        };
        window.addEventListener('beforeunload',checkDirty,false);
        var jump = function(e){
            var hash = location.hash;
            if(hash.indexOf('/')>-1){
                var parts = hash.split('/'),
                    fileNameEl = document.getElementById('file_name');
                view = parts[0].substring(1)+'-view';
                fileName = parts[1];
                fileNameEl.innerHTML = fileName;
            }else{
                if(!isDirty||confirm(unsavedMsg,unsavedTitle)){
                    markClean();
                    view = 'browser-view';
                    if(hash!='#list'){
                        location.hash = '#list';
                    }
                }else{
                    location.href = e.oldURL;
                }
            }
            document.body.className = view;
        };
        jump();
        window.addEventListener('hashchange',jump,false);

        //开启designMode 连接两种编辑器
        var editVisualButton = document.getElementById('edit_visual'),
            visualView = document.getElementById('file_contents_visual'),
            visualEditor = document.getElementById('file_contents_visual_editor'),
            visualEditorDoc = visualEditor.contentDocument,
            editHtmlButton = document.getElementById('edit_html'),
            htmlView = document.getElementById('file_contents_html'),
            htmlEditor = document.getElementById('file_contents_html_editor');
        visualEditorDoc.designMode = 'on';//将iframe切换到可编辑状态
        visualEditorDoc.addEventListener('keyup',markDirty,false);
        htmlEditor.addEventListener('keyup',markDirty,false);

        var updateVisualEditor = function(content){
            visualEditorDoc.open();
            visualEditorDoc.write(content);
            visualEditorDoc.close();
            visualEditorDoc.addEventListener('keyup',markDirty,false);
        };

        var updateHtmlEditor = function(content){// 更新html编辑器内容
            htmlEditor.value = content;
        };
        var toggleActiveView = function(){
            if(htmlView.style.display == 'block'){
                editVisualButton.className = 'split_left_active';
                visualView.style.display = 'block';
                editHtmlButton.className = 'split_right';
                htmlView.style.display = 'none';
                updateVisualEditor(htmlEditor.value);
            }else{
                editHtmlButton.className = 'split_right_active';
                htmlView.style.display = 'block';
                editVisualButton.className = 'split_left';
                visualView.style.display = 'none';

                var x = new XMLSerializer();
                var content = x.serializeToString(visualEditorDoc);
                updateHtmlEditor(content);
            }
        }
        editVisualButton.addEventListener('click',toggleActiveView,false);
        editHtmlButton.addEventListener('click',toggleActiveView,false);

        //实现富文本编辑工具栏
        var visualEditorToolbar = document.getElementById('file_contents_visual_toolbar');
        var richTextAction = function(e){
            var command,node = (e.target.nodeName==='BUTTON')?e.target:e.target.parentNode;
            if(node.dataset){
                command = node.dataset.command;
            }else{
                command = node.getAttribute('data-command');
            }
            var doPopupCommand = function(command,promptText,promptDefault){
                /**
                 * 第一个参数：command含有编辑或格式化行为的名称
                 * 第二个参数：确定用户能否看到与command相关的默认UI
                 * 第三个参数value：字符串，execCommand将调入以value为参数的command参数
                 */
                visualEditorDoc.execCommand(command,true,prompt(promptText,promptDefault));
            }
            if(command==='createLink'){
                doPopupCommand(command,'Enter link URL:','http://www.example.com');
            }else if(command==='insertImage'){
                doPopupCommand(command,'Enter image URL:','http://www.example.com/image.png');
            }else if(command==='insertMap'){
                /**
                 * geolcation方式：访问谷歌的服务
                 * 其位置的获取是通过收集用户周围的无线热点和您 PC 的 IP 地址。
                 * 然后浏览器把这些信息发送给默认的位置定位服务提供者，也就是谷歌位置服务，由它来计算您的位置。
                 * 最后用户的位置信息就在您请求的网站上被共享出来。
                 */
                if(navigator.geolocation){
                    node.innerHTML = 'Loading';
                    navigator.geolocation.getCurrentPosition(function(pos){
                        var coords = pos.coords.latitude+","+pos.coords.longitude;//维度，和精度
                        var img = 'http://maps.googleapis.com/maps/api/staticmap?markers='+coords+'&zoom=11&size=200x200&' +
                            'sensor=false';
                        console.info(img);
                        visualEditorDoc.execCommand('insertImage',false,img);
                        node.innerHTML = 'Location Map';
                    });
                }else{
                    alert('Geolocation not available','No geolocation data');
                }
            }
            else{
                visualEditorDoc.execCommand(command);
            }
        };
        visualEditorToolbar.addEventListener('click',richTextAction,false);
    };
    var init = function(){
        new SuperEditor();
    }
    window.addEventListener('load',init,false);
})();