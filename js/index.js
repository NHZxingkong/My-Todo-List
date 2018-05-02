;(function(){

	// 定义存储的格式
	var task_new_item = {};//以对象格式存储
	var task_list;//已经存在的任务列表，因为每次打开都要看到上次储存的内容，所以要拿到之前的任务项
	var taskItem;

	// 详情页面的时间提醒功能
	$('.datetime').datetimepicker();

    // 任务列表初始化
    init(); 

	// 页面初始化
	function init(){
		task_list = store.get('task_list') || [];
		store.set('task_list',task_list);
		render_task_list();
	    clickEvent();//事件函数
		task_remind();//时间提醒
	}

    // 事件提醒
	function task_remind(){
		var nowTime;
		var interval = setInterval(function(){
			for(var i=0;i<task_list.length;i++){
				var item = task_list[i];
				if(!item || !item.datetime || item.informed)
				continue;

				nowTime = (new Date()).getTime();
				var tarTime = (new Date(item.datetime)).getTime();
				if(nowTime - tarTime >= 0){
					task_list[i] = $.extend({},task_list[i],{informed:true});
					store.set('task_list',task_list);
					render_task_list();
					$('.inform_msg').fadeIn();
					$('.inform_msg .msg').text(task_list[i].content);
					$('.inform_video').get(0).play();
				}
			}
		},500)		
	};	
	
	// 任务列表渲染
	function render_task_list(){
		task_list = store.get('task_list');
		$('#input_field').val('');//清空输入框
		var str = '<li class="list-group-item"><input type="checkbox" class="check-all">'
		+'<div class="list-item-btn">'
		+'<a class="delete-all" data-toggle="model" href="#detail_model" style="cursor:pointer;">删除全部</a></div></li>';
		for(var i=0;i<task_list.length;i++){
            str += '<li class="list-group-item clearfix single-item '
            +(task_list[i].complete || '')
            +'">'
			+'<input type="checkbox" name="task_item" checkMark = "'
            +(task_list[i].check || '')
			+'">'
			+'<span class="list-text">'
			+ task_list[i].content +'</span>'
			+ '<div class="list-item-btn">'
			+'<a class="btn-delete" data-toggle="model" href="#delete_model">删除</a>'
			+'<a class="btn-detail" data-toggle="model" href="#detail_model">详情</a>'
			+'</div>'
			+'</li>';
			$('.list-contain').html(str);				
		};

		// 单个列表项复选框选中时，进行反选和完成标记
	    taskItem = $('input[name=task_item]');

	    // 初始化时复选框的选择情况
	    for(var i=0;i<taskItem.length;i++){
	    	$(taskItem[i]).prop('checked',Boolean(taskItem[i].attributes.checkmark.nodeValue));
	    };
	    // 初始化时全选框的选择情况
	    var selectedTask = $('[name=task_item]:checked');
    	$('.check-all').prop('checked',taskItem.length == selectedTask.length?true:false);		        		
	};

    // 更新列表
	function refresh_task_list(index,data){
		for(var i=0;i<task_list.length;i++){
			task_list[index] = $.extend({},task_list[index],data);
		};
		store.set('task_list',task_list);
	};

	// 详情页填充
	function add_detail(select,attr,exist_property){
		for(var i=0;i<task_list.length;i++){
			if($(select).attr(attr) == i){
				if(exist_property in task_list[i]){
					$(select).val(task_list[i][exist_property]);
				}else{
					$(select).val('');
				}
			}

		}
	};

	// 事件函数
	function clickEvent(){		
		// 监听表单提交
		$('.list-enter').on('submit',function(e){
			// 阻止表单的默认提交事件
			e.preventDefault();

			// 获取用户输入内容
			var task_content = $('#input_field').val();
			if(!task_content || (/^[ ]+$/.test(task_content)==true)) return;//如果用户输入内容为空或者输入空格，则之后代码不再执行

	        // 用户输入内容不为空则进行存储
			task_new_item.content = task_content;
			task_list.unshift(task_new_item);

			// 存储任务项
			store.set('task_list',task_list);

			// 更新任务列表
			render_task_list();
		});

        // 以下事件均使用事件委托，因为是动态渲染
		//双击任务项中间部分，显示详情页面
		$('.list-contain').dblclick('.single-item',function(e){
			if(e.target.nodeName != 'INPUT' && e.target.nodeName != 'A'){//避开复选框部分
				$(this).find('.btn-detail').trigger('click');
			};
		});

		// 全选按钮
		$('.list-contain').on('change','.check-all',function(){
			$('input[name=task_item]').prop('checked',$(this).prop('checked'));	
			if($(this).is(':checked')){
				$('li.single-item').addClass('completed');
				for(var i=0;i<task_list.length;i++){
					refresh_task_list(i,{complete:'completed',check:true});
				};
			}else{
				$('li.single-item').removeClass('completed');
				for(var i=0;i<task_list.length;i++){
					delete task_list[i].complete;
					refresh_task_list(i,{check:''});
				}
			}
		});

		// 单个复选框的点击事件
		$('.list-contain').on('change','input[name=task_item]',function(event){
			var index;
	    	var selectedItem = $('[name=task_item]:checked');
	    	$('.check-all').prop('checked',taskItem.length == selectedItem.length?true:false);

	    	// 标记完成
	    	if($(this).is(':checked')){
	    		var paLi = $(this).parents('li');
	    		var pre_index = $('.list-contain .single-item').index(paLi);//换位置之前的索引值
		    	paLi.addClass('completed');	
		    	$('.list-contain').append(paLi);
		    	$(paLi).attr('pre_index',pre_index);//将之前的索引值保存下来
		    	var lis = $('.list-contain .single-item');
		    	index = lis.index(paLi);//换位置之后的索引值
		    	for(var i=0;i<task_list.length;i++){
		    		for(var j=0;j<lis.length;j++){//交换位置
		    			if(task_list[i].content == $(lis[j]).find('span').text()){
		    				var tamp = task_list[i];
		    				task_list[i] = task_list[j];
		    				task_list[j] = tamp;
		    			}
		    		}
		    		
		    	}
		    	for(var i=0;i<task_list.length;i++){
		    		if(index == i){
		    			refresh_task_list(i,{complete:'completed',check:true});
		    		}
		    	}		    	
	    	}else{
	    		var paLi = $(this).parents('li');
	    		var pre_index = Number(paLi.attr('pre_index'));
	    		$('.list-contain li:eq('+ pre_index +')').after(paLi);//恢复到之前的位置
	    		paLi.removeClass('completed');
	    		var lis = $('.list-contain .single-item');
	    		index = lis.index(paLi);
	    		for(var i=0;i<task_list.length;i++){
		    		for(var j=0;j<lis.length;j++){//交换位置
		    			if(task_list[i].content == $(lis[j]).find('span').text()){
		    				var tamp = task_list[i];
		    				task_list[i] = task_list[j];
		    				task_list[j] = tamp;
		    			}
		    		}		    		
		    	}
		    	for(var i=0;i<task_list.length;i++){
		    		if(index == i){
		    			if('complete' in task_list[i]){
		    				delete task_list[i].complete;
		    				refresh_task_list(i,{check:''});
		    			}
		    		}
		    	}	
	    	}
		});

		// 任务列表'全部删除'按钮
		$('.list-contain').on('click','.delete-all',function(){
			if($('.check-all').is(':checked')){
				$('#delete_model').modal();
				$('.btn-sure').attr('nodemark','all');
				$('.delete-header h4').text('确定删除全部任务项？')
			}else{
				alert('请选中所有任务项！')
			}			
		});

		// 详情页模态框的调用
		$('.list-contain').on('click','.btn-detail',function(event){
			event.stopPropagation();//阻止事件冒泡
			var index = $('.list-contain .single-item').index($(this).parents('li'));
			$('#detail_model').modal();
			$('.detail_input').val($(this).parents('li').find('span').text());//详情页初始标题
			$('.btn-refresh').attr('nodemark',index);
			$('.detail_intro').attr('nodearea',index);
			$('.datetime').attr('nodetime',index);

			// 填充详情页介绍部分
			add_detail('.detail_intro','nodearea','content_intro');

			// 填充时间提醒部分
			add_detail('.datetime','nodetime','datetime');
		});		
		
		// 单项任务'删除'按钮事件
		$('.list-contain').on('click','.btn-delete',function(event){
			var index = $('.list-contain .single-item').index($(this).parents('li'));
			$('#delete_model').modal();
			$('.btn-sure').attr('nodemark',index);
		});
		// 事件委托end

		// 点击更新按钮
		$('.btn-refresh').on('click',function(){
			var task_index = $(this).attr('nodemark');			
			for(var i=0;i<task_list.length;i++){
				if(task_index == i){
					task_list[i].content = $('.detail_input').val();// 修改详情页初始标题
					var intro_content = $('.detail_intro').val();
					if(intro_content && (/^[ ]+$/.test(intro_content)==false)){
						task_list[i].content_intro = intro_content;//修改内容详情
					}

					var datetime = $('.datetime').val();//修改提醒时间内容
					if(datetime && (/^[ ]+$/.test(intro_content)==false)){
						task_list[i].datetime = datetime;
					}
				}
			}

			store.set('task_list',task_list);
			render_task_list();
		});

        // 提醒按钮点击事件
		$('.inform_btn').on('click',function(){
			$('.inform_msg').fadeOut();
			$('.inform_video').get(0).stop();
		});

		// 删除列表项模态框'确定'按钮事件
		$('.btn-sure').on('click',function(){
			var task_index = $(this).attr('nodemark');
			if(task_index == 'all'){
				store.clear();
				window.location.reload();
			}else{
				task_list = store.get('task_list');
				for(var i=0;i<task_list.length;i++){
					if(task_index == i){
						task_list.splice(i,1);
					}			
				}
				store.set('task_list',task_list);
				if(store.get('task_list').length>0){
					render_task_list();
				}else{
					window.location.reload();
				}
			}		
		});
	};	
})();