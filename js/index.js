var w = window,
	d = document;
	d.g = document.getElementById;
	d.c = document.createElement;
	
var b,
	cells; //состояние каждой ячейки

var p; //количество создания кораблей

var ships = [0,0,0,0];

var shots = 0, hits = 0, kills = 0, total = 0;
var showships, showstats; //настройки
var denied;

w.onload = function(){

	//Обработчик старта
	d.g('start').onclick = init;
	
	//Показываем настройки
	$('#opacity-block').fadeIn(function(){
		d.g('ualert').style.display = 'block';
	});
	
}

function init(){

	//Убираем настройки
	d.g('ualert').style.display = 'none';
	$('#opacity-block').fadeOut();
	
	//Считываем настройки
	showships = d.g('show-ships').checked;
	showstats = d.g('show-stats').checked;
	
	//Если стоит показывать статистику - показываем
	if(showstats)
		show_statistic();

	//Создаём игровое поле
	b = d.g('border');
	$(b).animate({height: '+=220px'}, 1000);
	
	//Обработчик нажатия на финиш
	d.g('finish').onclick = function(){ w.location.reload(true); }
	
	//Создаем рамку для игрового поля
	b.style.border = '1px solid #9E9E9E';
	make_cell();
}

//Показ статистики 
function show_statistic(){
	$('#field').animate({width:'50%'}, function(){
			$('#statistic').fadeIn(1500);
	});
}

//Создание кораблей
function make_all_ships(){
	cells = [];
	p = 0;
	ships = [0,0,0,0];
	
	for(q=3;q>-1;q--){
		while(ships[q] < 4-q) {
			make_ship(q+1);
		}
	}
	
	render();
}

//Случайная координата
function rand(){
	return Math.ceil(Math.random()*100) - 1;
}

//Создание кораблей
function make_ship(decks){
	p++; //попытки создания кораблей
	if(p > 14) { make_all_ships(); return; } //если попыток больше 20, всё сбрасываем и начинаем снова
	
	var delta = Math.pow(10, Math.round(Math.random())); //Случайное направление положения корабля (вертикальное или горизонтальное)
	var coord = rand(); //координаты первой палубы
	while(cells[coord] != undefined) //ищем свободную клетку для начала строительства
		coord = rand();
	var j = 0, k = 0; //количество уже установленных палуб и попыток создать корабль
	var flag = true; //флаг для определения, в какую сторону двигаться при размещении палуб
	
	var coords = [];
	denied = [];
	
	while (j<decks) {

		if(!flag) k++;
		if (k > decks) { //если попыток установки палубы больше, чем самих палуб
			//сбрасываем использованные координаты
			for(m=0;m<coords.length;m++)
				cells[coords[m]] = undefined;
			return;
		}
		
		//переходим на следующую ячейку
		if(flag) coord += delta;
		else coord -= delta;
		
		//если ячейка занята - запускаем новую иттерацию
		if (cells[coord] != undefined)  { flag = false; k++; continue; }
		
		//Если корабль горизонтальный и палуба переходит на новую строку и это не первая палуба - меняем направление
		if (delta == 1 && coord%10 == 0 && j != 0) { flag = false; continue; }
		
		//если вышли за пределы поля, разварачиваем движение
		if (coord > 99) { flag = false; continue; }

		//если всё в порядке
		cells[coord] = 'ship';
		coords.push(coord); //сохраняем использованную координату в случае сброса
		j++;
	}
	
	//устанавливаем занятость ячеек, чтобы нельзя было выставлять корабли с прикосновением
	for (i=0;i<coords.length;i++){
		var ci = coords[i];
		if(ci != 0 && ci%10 != 0){ 
			if(ci/10 > 1)
				set_denied(ci-11);
				set_denied(ci-1);
			if(ci/10 < 9)
				set_denied(ci+9);
		}
		if(ci != 9 && ci%10 != 9){ 
			if(ci/10 >= 1)
				set_denied(ci-9);
				set_denied(ci+1);
			if(ci/10 < 9)
				set_denied(ci+11);
		}
			
		if(ci/10 >= 1)
			set_denied(ci-10);
		
		if(ci/10 < 9)
			set_denied(ci+10);
	}
	
	//Записываем в ячейку, часть какого корабля она является (для определения убийства) и ячейки вокруг корабля
	for(i=0;i<coords.length;i++) {
		b.childNodes[coords[i]].decks = coords;
		b.childNodes[coords[i]].denied = denied;
	}
	
	ships[decks-1]++; //записываем, что корабль создан
}

//Функиця выставления занятости ячейки
function set_denied(n){

	//если ячейка выходит за границы поля - не обозначать её
	if(n >= 0 && n < 100 && (cells[n] == undefined || cells[n] == 'denied')){
		cells[n] = 'denied';
		denied.push(n);
	}
}

//Функция создания ячейки
function make_cell(){
	
	//Проверка количества ячеек
	if(b.childNodes.length >=100 ) { setTimeout(make_all_ships, 1000); return; }
	
	//Создание ячейки и добавление
	var cell = d.c('div');
		cell.className = 'cell';
		cell.style.opacity = '0';
		b.appendChild(cell);
		$(cell).animate({opacity:'1'}, 1500);
		make_cell();
}

//Выстрел
function shot(obj){
	var cls = obj.className;
	if(cls.indexOf('ship') == -1)
		obj.className = 'cell miss';
	else {
		obj.className = 'cell hit';
		
		//Проверяем, было ли это убийство
		var kill = true;
		for(i=0;i<obj.decks.length;i++)
			if(b.childNodes[obj.decks[i]].className.indexOf('ship') != -1) kill = false;
		if(kill) {	
			kills++;
			for(i=0;i<obj.decks.length;i++)
				b.childNodes[obj.decks[i]].className = 'cell kill';
				
			for(i=0;i<obj.denied.length;i++)
				b.childNodes[obj.denied[i]].className = 'cell miss';
				
			//Если убийств 10, показываем статистику
			if(kills == 10) {
				show_statistic();
				$('#finish').fadeIn();
			}
		}
		else hits++;
		
		shots++;
	}
	obj.onclick = null;
	
	total++;
	
	update_statistics(); //обновление статистики
}

//Функция отрисовки кораблей после формирования таблицы
function render(){
	for(i=0;i<100;i++){
		var cls = (cells[i] != undefined) ? cells[i] : '';
		var cell = b.childNodes[i];
		cell.className = 'cell ' + cls;
		
		//Обработчик нажатий
		cell.onclick = function(){ shot(this); }
	}
	
	//если стоит не показывать корабли - не показываем
	if(!showships)
		$('.ship').css({background: 'steelBlue', borderColor: '#9e9e9e'});
}

//Обновление статистики
function update_statistics(){
	var stats = ['total','kills','shots','hits'];
	for(i=0;i<stats.length;i++)
		d.g(stats[i]).childNodes[1].innerHTML = w[stats[i]];
}