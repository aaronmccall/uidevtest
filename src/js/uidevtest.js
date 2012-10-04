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

(function ($) {
	var story_data = [],
		templates = {},
		$body = $(document.body),

		init_handlers = function () {
			$body.on('click', '.story_item a', function (e) {
				e.preventDefault();
				render_story(story_data, this);
			});
		},

		get_story = function (location_obj, data) {
			var index_match = location_obj.href.match(/\bsto([\d]+)\b/),
				index;
			if (!index_match) {
				return null;
			}
			index = parseInt(index_match.pop().replace(/^0/, ''));
			if (!index) return null;
			return {index: index, data: data[index-1] || null};
		},

		is_story = function (location) {
			return !!location.search.match(/\bstory=sto[\d]{2}\b/);
		},

		render_page = function (data) {
			var rendering_story = is_story(window.location);
			if (rendering_story) {
				render_story(data, window.location);
			} else {
				render_list(data);
			}
		},

		render_story = function (data, location_obj) {
			var story = get_story(index, data),
				story_html;
			if (story) {
				story_html = templates.story_detail(story.data);
				$body.html(story_html);
			}
		},

		render_list = function (data) {
			var items = [], html;
			$.each(data, function (index, item) {
				items.push(templates.story_list_item(item));
			});
			html = templates.story_list({story_list: items.join("\n")});
			$body.html(html);
		};

		$.getJSON('../js/uidevtest-data.js', function (data) {
		if (data && data.objects) {
			$.each(data.objects, function (idx, story) {
				var id = (idx+1 < 10) ? '0' + (idx+1) : (idx+1),
					categories = story.categories_name.join(", ");
				story.categories = categories;
				story.id = id;
				story.post_date = App.format_date(story.pub_date);
				story.update_date = App.format_date(story.updated);
				story.byline = story.author.join(", ");
				story.publication = story.publication||App.base_publication;
				story_data.push(story);
			});
		}
		render_page(story_data);
		init_handlers();
	}).error(function (jqXhr, err_type, err) {
		console && console.log(err_type + ': ' + err);
	});

	$("script[type='text/x-template']").each(function () {
		var $this = $(this);
		templates[this.id] = function (data) {
			return App.renderer($this.text(), data);
		};
	});
})(window.jQuery);