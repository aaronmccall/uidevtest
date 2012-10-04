var App ={
	base_title: 'Home > News',
	base_publication: 'The Atlanta Journal-Constitution',
	renderer: Flatstache.to_html,

	history: (function(window, undefined){
	    var history = window.history,
	        doc = window.document,
	        state_changer = function(type, data, title, url){
	            this[type+'State'].apply(this, _.rest(arguments));
	            if (title && doc.title !== title) doc.title = title;
	        },
	        noop = function(){};

	    return {
	        pushState: (history.pushState && _.isFunction(history.pushState)) ? _.bind(state_changer, history, 'push') : noop,
	        replaceState: (history.replaceState && _.isFunction(history.replaceState)) ? _.bind(state_changer, history, 'replace') : noop
	    };
	})(window),

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
		
	},
	// Can be called with any object that has an href property
	index_from_location: function (location_obj) {
		var index_match = location_obj.href.match(/\bsto([\d]+)\b/),
			index;
		if (!index_match) {
			return null;
		}
		index = parseInt(index_match.pop().replace(/^0/, ''));
		return index;
	}
};

(function ($) {
	var story_data = [],
		templates = {},
		$body = $(document.body),

		init_handlers = function () {
			if (window.history && window.history.pushState) {
				$body.on('click', '.story_item a', function (e) {
					e.preventDefault();
					render_story(story_data, App.index_from_location(this));
					App.history.pushState({story: App.index_from_location(this)}, App.base_title + ' > '  + $(this).text(), this.href);
				});
					
				$(window).on('popstate', function (e) {
					if (e.originalEvent && e.originalEvent.state) {
						var state = e.originalEvent.state;
						if (state.list) {
							render_list(story_data);
							App.history.replaceState(state, App.base_title, window.location.pathname);
						} else if (state.story) {
							render_story(story_data, state.story);
						}
					}
				});
			}
		},

		render_breadcrumbs = function (data) {
			var bc_data = data || [
				{link: location.pathname.split('/').slice(0,-1).join('/')+'/', text: 'Home'},
				{link: location.pathname, text: 'News'}
			], rendered_crumbs = [];
			$.each(bc_data, function (idx, crumb) {
				rendered_crumbs.push(templates.breadcrumb(crumb));
			});
			return rendered_crumbs.join(" > ");
		},

		get_story = function (index, data) {
			if (!index) return null;
			return {index: index, data: data[index-1] || null};
		},

		is_story = function (location) {
			return !!location.search.match(/\bstory=sto[\d]{2}\b/);
		},

		render_page = function (data) {
			var rendering_story = is_story(window.location);
			if (rendering_story) {
				render_story(data, App.index_from_location(window.location));
			} else {
				render_list(data);
			}
		},

		render_story = function (data, index) {
			var story = get_story(index, data),
				story_html;
			if (story) {
				story_html = templates.story_detail($.extend({}, story.data, {breadcrumbs: render_breadcrumbs()}));
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
		if (!is_story(window.location)) {
			App.history.replaceState({list: true}, App.base_title, window.location.href);
		}
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