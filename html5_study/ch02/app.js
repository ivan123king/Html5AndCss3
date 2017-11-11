/**
 * Created by lenovo on 2017/11/3.
 */
(function(){
    var init = function(){
        var orderForm = document.forms.order,
        saveBtn = document.getElementById('saveOrder'),
            saveBtnClicked = false;
        var saveForm = function(){
            /*
             * 验证input元素是否支持formAction属性
             * 如果不支持就需要通过js修改form表单的action路径为saveOrder中配置的formaction路径
             * */
            if( !('formAction' in document.createElement('input'))){
                var formAction = saveBtn.getAttribute('formaction');
                orderForm.setAttribute('action',formAction);
            }
            saveBtnClicked = true;
        };
        EventUtil.addHandler(saveBtn,'click',saveForm);
        // saveBtn.addEventListener('click',saveForm,false);

        //计算总金额
        var qtyFields = orderForm.quantity,
            // totalFields = document.getElementsByClassName('item_total'),
            totalFields = EventUtil.getElementByClassName('item_total'),
            orderTotalField = document.getElementById('order_total');

        var formatMoney = function(value){
            //  /g修饰符代表全局匹配，查找所有匹配而非在找到第一个匹配后停止,第二次匹配的位置是从上一次匹配结束位置开始，而非重新从0位开始
            /**
             * var str = "123#abc";
             var noglobal = /abc/i;//非全局匹配模式
             console.log(re.test(str)); //输出ture
             console.log(re.test(str)); //输出ture
             console.log(re.test(str)); //输出ture
             console.log(re.test(str)); //输出ture
             var re = /abc/g;//全局匹配
             console.log(re.test(str)); //输出ture
             console.log(re.test(str)); //输出false
             console.log(re.test(str)); //输出ture
             console.log(re.test(str)); //输出false

             var str = "012345678901234567890123456789";
             var re = /123/g;
             console.log(re.lastIndex); //输出0,正则表达式刚开始创建
             console.log(re.test(str)); //输出ture
             console.log(re.lastIndex); //输出4
             console.log(re.test(str)); //输出true
             console.log(re.lastIndex); //输出14
             console.log(re.test(str)); //输出ture
             console.log(re.lastIndex); //输出24
             console.log(re.test(str)); //输出false
             console.log(re.lastIndex); //输出0,没有找到匹配项被重置
             */
            //  /B匹配非单词边界  没有与单词分隔符相邻的位置  即，此单词前或后没有空格
            /**
             * 单词边界是一个虚拟的存在，指代的是词与单词分隔符（通常是空白字符）之间的位置，非单词边界就是没有与单词分隔符相邻的位置
             例如
             hello world
             第一个o和后面的空格之间就是单词边界，第二个o则没有与单词边界相连
             o\b可以匹配第一个o，因为它相邻着一个单词边界
             o\B可以匹配第二个o，因为它没有相邻单词边界（隔了一个h）
             */
            //  ?=  表示匹配一个符合后面正则要求的位置而已  此处是( \d{3})   ?:  表示反向取数， 是非获取匹配 和 ?=正好相反
            // ?=获取匹配的数据， ?: 返回不匹配的数据
            /**
             ?= 是正向肯定 断言  ,  ?! 正向否定断言
             */
            /**
             * (?!\d) 的存在，这是一个正向否定断言，表示连续三个数字之后不能存在数字
             * 此正则表达式意思为： 匹配非单词边界数值个数是3的倍数，且对后面的一个或多个连续三组数字+一组非数字进行匹配
             * 匹配1234567如此数字   1,234567 满足   1,234,567 满足，第一个是234567个数是3倍数，567个数也是3倍数
             */
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g,",");
        }
        var calculateTotals = function(){
            var i = 0,
                ln = qtyFields.length,
                itemQty = 0,//数量
                itemPrice = 0.00,//单价
                itemTotal = 0.00,//总价
                itemTotalMoney = '$0.00',//格式化的某种商品总价
                orderTotal = 0.00,//此订单所有商品总价
                orderTotalMoney = '$0.00';//格式化的此订单所有商品总价

            for(;i<ln;i++){
                if(!!qtyFields[i].valueAsNumber){
                    itemQty = qtyFields[i].valueAsNumber || 0;
                }else{
                    itemQty = parseFloat(qtyFields[i].value)||0;
                }
                //从data-*属性中获取产品价格
                if(!!qtyFields[i].dataset){
                    itemPrice = parseFloat(qtyFields[i].dataset.price);
                }else{
                    itemPrice = parseFloat(qtyFields[i].getAttribute('data-price'));
                }
                itemTotal = itemQty*itemPrice;
                //toFixed() 方法可把 Number 四舍五入为指定小数位数的数字。
                itemTotalMoney = '$'+formatMoney(itemTotal.toFixed(2))
                orderTotal += itemTotal;
                orderTotalMoney = '$'+formatMoney(orderTotal.toFixed(2));

                //在output元素中显示总金额
                if(!!totalFields[i].value){
                    totalFields[i].value= itemTotalMoney;
                    orderTotalField.value = orderTotalMoney;
                }else{
                    totalFields[i].innerHTML = itemTotalMoney;
                    orderTotalField.innerHTML = orderTotalMoney;
                }
            }
        };
        calculateTotals();
        var qtyListeners = function(){
            var i=0,
                ln = qtyFields.length;
            for(;i<ln;i++){
                // qtyFields[i].addEventListener('input',calculateTotals,false);
                // qtyFields[i].addEventListener('keyup',calculateTotals,false);
                EventUtil.addHandler(qtyFields[i],'input',calculateTotals);
                EventUtil.addHandler(qtyFields[i],'keyup',calculateTotals);

            }
        };
        qtyListeners();

        //表单数据长度自定义验证
        var doCustomValidity = function(field,msg){
            if('setCustomValidity' in field){
                field.setCustomValidity(msg);
            }else{
                field.validationMessage = msg;
            }
        };
        var validateForm = function(){
            doCustomValidity(orderForm.name,'');
            doCustomValidity(orderForm.password,'');
            doCustomValidity(orderForm.confirm_password,'');
            doCustomValidity(orderForm.card_name,'');

            if(!Modernizr.input.required ||!Modernizr.input.pattern){
                fallbackValidation();//针对IE9不支持HTML5验证，使用JS验证方式。
            }

            if(orderForm.name.value.length<4){
                doCustomValidity(orderForm.name,'Full name must be at least 4 characters long');
            }
            if(orderForm.password.value.length<8){
                doCustomValidity(orderForm.password,'Password must be at least 8 characters long');
            }
            if(orderForm.confirm_password.value!=order.password.value){
                doCustomValidity(orderForm.confirm_password,'Confirm Password must match Password');
            }
            if(orderForm.card_name.value.length<4){
                doCustomValidity(order.card_name,'Name on Card must be at least 4 characters long');
            }
        };
        // orderForm.addEventListener('input',validateForm,false);
        // orderForm.addEventListener('keyup',validateForm,false);
        EventUtil.addHandler(orderForm,'input',validateForm);
        EventUtil.addHandler(orderForm,'keyup',validateForm);

        //侦听表单验证invalid事件
        var styleInvalidForm = function(){
            orderForm.className = 'invalid';
        }
        // orderForm.addEventListener('invalid',styleInvalidForm,false);
        EventUtil.addHandler(orderForm,'invalid',styleInvalidForm);

        //部署特性侦测，對不支持時間控件的瀏覽器額外自己加載monthpicker.js
        Modernizr.load({
           test:Modernizr.inputtypes.month,
            nope: 'monthpicker.js'
        });

        //對於不支持HTML5驗證的瀏覽器，手動驗證
        var getFieldLabel = function(field){
            if('labels' in field && field.labels.length>0){
                return field.labels[0].innerText;
            }
            if(field.parentNode&&field.parentNode.tagName.toLowerCase()==='label'){
                return field.parentNode.innerText;
            }
            return '';
        }
        //Safari5.1中阻止无效表单的提交
        var submitForm = function(e){
            if(!saveBtnClicked){//如果点击的不是保存按钮
                validateForm();
                var i=0,
                    ln = orderForm.length,
                    field,
                    errors = [],
                    errorFields = [],
                    errorMsg = '';
                for(;i<ln;i++){
                    field = orderForm[i];
                    if((!!field.validationMessage&&field.validationMessage.length>0)
                        ||(!!field.checkValidity&&!field.checkValidity())){
                        errors.push(getFieldLabel(field)+':'+field.validationMessage);
                        errorFields.push(field);
                    }
                }
                if(errors.length>0){
                    e.preventDefault();
                    errorMsg = errors.join('\n');
                    alert('Please fix the following errors:\n'+errorMsg,'Error');
                    orderForm.className = 'invalid';
                    errorFields[0].focus();
                }
            }
        };
        orderForm.addEventListener('submit',submitForm,false);

        //IE9验证回退方案，IE9不支持验证type=email,pattern等这些Input的HTML5属性，使用如下js验证
        var fallbackValidation = function(){
            var i=0,
                ln = orderForm.length,
                field;
            for(;i<ln;i++){
                field = orderForm[i];
                doCustomValidity(field,'');
                if(field.hasAttribute('pattern')){
                    var pattern = new RegExp(field.getAttribute('pattern').toString());
                    if(!pattern.test(field.value)){
                        var msg = 'Please match the requested format.';
                        if(field.hasAttribute('title')&&field.getAttribute('title').length>0){
                            msg += ' '+field.getAttribute('title');
                        }
                        doCustomValidity(field,msg);
                    }
                }
                if(field.hasAttribute('type')&&field.getAttribute('type').toLowerCase()==='email'){
                    var pattern = new RegExp(/\S+@\S+\.\S+/);
                    if(!pattern.test(field.value)){
                        doCustomValidity(field,'Please enter an email address.');
                    }
                }
                if(field.hasAttribute('requeired')&&field.value.length<1){
                    doCustomValidity(field,'Please fill out this field.');
                }
            }
        }
    };

    EventUtil.addHandler(window,'load',init);
    // var browser = navigator.userAgent;
    // if(browser.indexOf("MSIE")>=0){//IE
    //     window.load = init();
    // }
    // else if(browser.indexOf("Chrome")>=0){//Chrome
    //     window.addEventListener('load',init,false);
    // }
})();