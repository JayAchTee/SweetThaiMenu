define(['jquery', 'handlebars', 'underscore', 'req-guid'], function ($, Handlebars, _, guid)
{
	window.templates = [];

	var templates = window.templates;

	//	Load any dynamic templates for Handlebars ... 
	$("[type='text/x-handlebars-dynamic-template']").each(function (index, item)
	{
		var $item = $(item);

		var tag = $item.attr("id") || $item.attr("name");
		var url = $item.data("href") || tag;

		if (url)
		{
			if (url.match("-template$"))
			{
				url = url.replace("-template", ".html");

				url = "templates/" + url;
			}

			$.when($.get(url)).then(function (data, status)
			{
				$item.html(data);

				var partial = $item.data("partial");

				if (partial)
				{
					Handlebars.registerPartial("orderItem", $item.html());
				}

				if (tag)
				{
					templates.push({ tag: tag, template: Handlebars.compile(data) });
				}
			});
		}
	});

	return (templates);
});