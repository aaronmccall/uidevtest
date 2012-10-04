var App ={
	renderer: Flatstache.to_html,

	format_date: function (date_string) {
		var date = new Date(date_string),
			date_tpl = '{{ hr }}:{{ min }} {{ am_pm }} {{ day }}, {{ mo }}. {{ mo_day }}, {{ year }}';
		if (date.getDate()) {
			var raw_hr = date.getHours(),
				raw_min = date.getMinutes(),
				date_obj = {
					am_pm: (raw_hr <= 12) ? 'a.m.' : 'p.m.',
					hr: (raw_hr > 12) ? raw_hr - 12 : raw_hr || 12,
					day: date.toLocaleDateString().split(',').shift(),
					mo_day: date.getDate(),
					mo: date.toLocaleString().split(' ').slice(1,2).shift(),
					min: (raw_min < 10) ? '0'+raw_min : ''+raw_min,
					year: date.getFullYear()
				};
			return this.renderer(date_tpl, date_obj);
		}
		
	}
};