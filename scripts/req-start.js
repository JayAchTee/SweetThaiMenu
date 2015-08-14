"use strict";

requirejs.config(
	{
		baseUrl: 'scripts',
		waitSeconds: 0,
		paths:
			{
				jquery: '//code.jquery.com/jquery-1.11.3.min',
				migrate: '//code.jquery.com/jquery-migrate-1.2.1.min',
				bootstrap: '//maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min',
				kendo: '//cdn.kendostatic.com/2014.1.318/js/kendo.web.min',
				underscore: 'lib/underscore',
				handlebars: 'lib/handlebars',
				backbone: 'lib/backbone',
				computedfields: 'lib/backbone-computedfields' 
			},
		shim:
			{
				'migrate':
					{
						deps: ['jquery'] 
					},
				'bootstrap':
					{
						deps: ['jquery']
					},
				'backbone':
					{
						deps: ['underscore', 'jquery'],
						exports: 'Backbone'
					},
				'underscore':
					{
						exports: '_'
					},
				'computedfields': 
					{
						deps: ['backbone'] 
					},
				'kendo':
					{
						deps: ['jquery', 'migrate'],
						exports: 'kendo'
					}
			}
	});

//	Crank up the framequirks and ... 
requirejs(['jquery', 'migrate', 'handlebars', 'bootstrap', 'kendo', 'underscore', 'backbone', 'computedfields'], function ($, migrate, Handlebars)
	{
		//	... add helpers, et cetera ...

		//	This is a Handlebars Helper to format values as a currency 
		Handlebars.registerHelper('formatCurrency', function (value)
		{
			value = parseFloat(value);

			return (value.toFixed(2).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"));
		});

		//	This is a Handlebars Helper that pulls a attribute value from a Backbone.Model 
		Handlebars.registerHelper('model', function (name)
		{
			try
			{
				return (this.get(name));
			}
			catch (exception)
			{
				return (name + ": " + exception);
			}
		});

		//	... then the dynamic templates 
		requirejs(['lib/domReady', 'req-dynamic-templates'], function (DLT)
		{
			//	... then the applitron itself!
			requirejs(['req-guid', 'req-app', 'req-menu']);
		});
	});

