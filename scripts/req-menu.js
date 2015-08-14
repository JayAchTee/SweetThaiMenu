define(['jquery', 'backbone', 'handlebars', 'underscore', 'kendo', 'req-guid'], function ($, Backbone, Handlebars, _, kendo, guid) 
{ 
	//	When jQuery is ready ...
	$(function ()
	{
		//	First, we do the Order items (some items have options so we have to clone the Menu Item and add the option attribute)
		var OrderItem = Backbone.Model.extend(
			{
				//	Use a GUID to track order items as option items need to be totally unique 
				idAttribute: "uuid",
				//	This is pretty much a clone of the MenuItem from here to the end... 
				initialize: function () {
					this.computedFields = new Backbone.ComputedFields(this);
				},
				changeSelected: function (value) {
					value = parseInt(value);

					if (value) {
						var selected = (this.get("selected") || 0);

						selected += value;

						if (selected < 0) {
							selected = 0;
						}

						this.set("selected", selected);
					}
				},
				computed:
				{
					convertedPrice:
						{
							depends: ["price"],
							get: function (attributes) {
								return (parseFloat((parseFloat(attributes.price) / 100.00)).toFixed(2));
							}
						},
					extendedPrice:
						{
							depends: ["price", "selected"],
							get: function (attributes) {
								return (((parseFloat(attributes.price) / 100.00) * parseFloat(attributes.selected)).toFixed(2));
							}
						},
					dateValid:
						{
							depends: ["selected", "ageVerify"],
							get: function (attributes) {
								var today = new Date();

								var valid = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate(), 0, 0, 0);

								return (valid.toLocaleDateString());
							}
						}
				}
			});

		//	... and a list to hold them.
		var OrderItemList = Backbone.Collection.extend(
			{
				model: OrderItem
			});

		//	... and create the list of menu items.
		var OrderItems = new OrderItemList;

		//	Define the presentation and actions for the menu item.
		var OrderItemView = Backbone.View.extend(
			{
				className: "order-item",
				tagName: "tr",
				//	Respone to these events ... see the handlers in the second argument in "this".
				events:
				{
					"click .addButton": "add",
					"click .subButton": "subtract",
					"click .clrButton": "zero"
				},
				//	Listen to change and remove events in the model.
				initialize: function () {
					this.listenTo(this.model, "change", this.render);
					this.listenTo(this.model, "remove", this.remove);
				},
				//	Presentation is done using a compiled Handlebar template ...
				template: Handlebars.compile($("#order-item-template").html()),
				//	... in the render function.
				render: function () {
					this.$el.html(this.template(this.model.toJSON()));

					this.$el.find("[data-role=dropdownlist]").kendoDropDownList();

					return (this);
				},
				//	Increment the selected count of the order item
				add: function () {
					var selected = (this.model.get("selected") || 0);

					selected += 1;

					this.model.set("selected", selected);

					return (this);
				},
				//	Decrement the selected count of the order item
				subtract: function (e) {
					var selected = (this.model.get("selected") || 0);

					selected -= 1;

					if (selected < 0) {
						selected = 0;
					}

					this.model.set("selected", selected);

					if (selected == 0) {
						OrderItems.remove(this.model);
					}
					else {
						var item = MenuItems.findWhere({ id: this.model.get("id") });

						if (item) {
							selected = (item.get("selected") || 0);

							selected -= 1;

							if (selected < 0) {
								selected = 0;
							}

							item.set("selected", selected);
						}
					}

					return (this);
				},
				//	Zero out the selected count of the order item
				zero: function () {
					this.model.set("selected", 0);

					OrderItems.remove(this.model);

					return (this);
				}
			});

		//	Next, we define a menu item model ...
		var MenuItem = Backbone.Model.extend(
			{
				//	Add defaults of selected = 0 and availabe = true since they aren't in the JSON model set.
				defaults: function () {
					return ({ "selected": 0, "available": true });
				},
				initialize: function () {
					this.computedFields = new Backbone.ComputedFields(this);
				},
				changeSelected: function (value) {
					value = parseInt(value);

					if (value) {
						var selected = (this.get("selected") || 0);

						selected += value;

						if (selected < 0) {
							selected = 0;
						}

						this.set("selected", selected);
					}
				},
				computed:
				{
					convertedPrice:
						{
							depends: ["price"],
							get: function (attributes) {
								return (parseFloat((parseFloat(attributes.price) / 100.00)).toFixed(2));
							}
						},
					extendedPrice:
						{
							depends: ["price", "selected"],
							get: function (attributes) {
								return (((parseFloat(attributes.price) / 100.00) * parseFloat(attributes.selected)).toFixed(2));
							}
						},
					dateValid:
						{
							depends: ["selected", "ageVerify"],
							get: function (attributes) {
								var today = new Date();

								var valid = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate(), 0, 0, 0);

								return (valid.toLocaleDateString());
							}
						},
					hasOptions:
						{
							depends: ["options"],
							get: function (attributes) {
								if ((attributes.options) && (attributes.options.length)) {
									return (true);
								}

								return (false);
							}
						}
				}
			});

		//	... and a list to hold them ...
		var MenuItemList = Backbone.Collection.extend(
			{
				model: MenuItem,
				url: "data/menu.json",
				initialize: function () {
					var self = this;

					//	Fetch the models from the defined "url" property.
					this.fetch().then(function (data, status, xhr) {
						//	Tell others listening that i've loaded data from the server using the databound custom event
						self.trigger("databound", [self, data, status, xhr]);
					});
				},
				//	Filter out any items where the availbale property is not "true".
				available: function () {
					return (this.where({ available: true }));
				},
				//	Filter out any items where the selected property is zero or null.
				selected: function () {
					return (this.filter(function (model) { return (model.get("selected")); }));
				}
			});

		//	... and create the list of menu items.
		var MenuItems = new MenuItemList;

		//	Define the presentation and actions for the menu item.
		var MenuItemView = Backbone.View.extend(
			{
				className: "menu-item",
				tagName: "li",
				//	Respone to these events ... see the handlers in the second argument in "this".
				events:
				{
					"click .addButton": "add"
				},
				//	Listen to change and remove events in the model.
				initialize: function () {
					this.listenTo(this.model, "change", this.render);
					this.listenTo(this.model, "remove", this.remove);
				},
				//	Presentation is done using a compiled Handlebar template ...
				template: Handlebars.compile($("#menu-item-template").html()),
				//	... in the render function.
				render: function () {
					this.$el.html(this.template(this.model.toJSON()));

					this.$el.find("[data-role=dropdownlist]").kendoDropDownList();

					return (this);
				},
				//	Increment the selected count of the menu item and create or increment the order item to mirror it
				add: function () {
					var selected = (this.model.get("selected") || 0);
					var hasOptions = (this.model.get("hasOptions") || false);

					selected += 1;

					if (selected) {
						var item = null;

						//	If the menu item has options, we need to create a single order item with just this option set ... 
						if (hasOptions) {
							item = new OrderItem(this.model.toJSON());

							var option = $("#options_" + this.model.get("id")).val();

							if (option) {
								item.set("option", option);
							}

							item.set("uuid", guid());
							item.set("selected", 1);

							OrderItems.add(item);
						}
							//	... otherwise, we can just increment the existing item or create a singleton mirror order item
						else {
							item = OrderItems.findWhere({ id: this.model.get("id") });

							if (item) {
								var selected = (item.get("selected") || 0);

								selected += 1;

								item.set("selected", selected);
							}
							else {
								item = new OrderItem(this.model.toJSON());

								item.set("uuid", guid());
								item.set("selected", selected);

								OrderItems.add(item);
							}
						}
					}

					this.model.set("selected", selected);

					return (this);
				}
			});

		var MenuAppView = Backbone.View.extend(
			{
				el: "#order",
				events:
				{
					"click .addButton": "add",
					"click .subButton": "subtract",
					"click .clrButton": "zero",
					"click .donButton": "done"
				},
				initialize: function () {
					this.listenTo(MenuItems, "add", this.registerMenuItem);
					this.listenTo(MenuItems, "databound", this.render);
					this.listenTo(MenuItems, "change", this.render);

					this.listenTo(OrderItems, "add", this.registerOrderItem);
					this.listenTo(OrderItems, "remove", this.unregisterOrderItem);
					this.listenTo(OrderItems, "reset", this.unregisterAllOrderItems);
					this.listenTo(OrderItems, "change", this.render);
				},
				//	Create the view to render the menu item 
				registerMenuItem: function (model) {
					var view = new MenuItemView({ model: model });

					$("#menu").append(view.render().el);

					return (this);
				},
				//	Create the view to render the order item 
				registerOrderItem: function (model) {
					var view = new OrderItemView({ model: model });

					//$("#order-rows").append(view.render().el);

					return (this);
				},
				//	Find the order item and decrement the selected count setting it to zero if it goes negative
				unregisterOrderItem: function (model) {
					var item = MenuItems.findWhere({ id: model.get("id") });

					if (item) {
						var selected = (item.get("selected") || 0);

						selected -= 1;

						if (selected < 0) {
							selected = 0;
						}

						item.set("selected", selected);
					}

					return (this);
				},
				//	Clear the output if the OrderItems collection get "reset" 
				unregisterAllOrderItems: function (source, options) {
					$("#order-rows").html("");

					this.render();

					return (this);
				},
				//	This is my composite template with a partial template to render order item rows 
				template: Handlebars.compile($("#order-template").html()),
				//	Build the order object from the OrderItems collection 
				order: function () {
					var count = 0;
					var subtotal = 0.00;

					var selected = OrderItems.models;

					_.each(selected, function (model) {
						count += parseInt(model.get("selected"));

						subtotal += parseFloat(model.get("extendedPrice"));
					}, this);

					return (
						{
							subtotal: subtotal,
							tax: subtotal * 0.06,
							total: subtotal * 1.06,
							plustip15: (subtotal * 1.15) + (subtotal * 0.06),
							plustip18: (subtotal * 1.18) + (subtotal * 0.06),
							plustip20: (subtotal * 1.20) + (subtotal * 0.06),
							count: count,
							items: OrderItems.toJSON()
						});
				},
				//	Render the complete order view from the built-up OrderItems 
				render: function () {
					$("#order-total").html(this.template(this.order()));

					return (this);
				},
				//	In the order item, increment the selected amount 
				add: function (e) {
					if ((e) && (e.target)) {
						var orderItem = OrderItems.findWhere({ uuid: $(e.target).data("id") });

						if (orderItem) {
							orderItem.changeSelected(1);

							var menuItem = MenuItems.findWhere({ id: orderItem.get("id") });

							if (menuItem) {
								menuItem.changeSelected(1);
							}
						}
					}

					return (this);
				},
				//	In the order item, decrement the selected amount and remove it if selected is zero 
				subtract: function (e) {
					if ((e) && (e.target)) {
						var orderItem = OrderItems.findWhere({ uuid: $(e.target).data("id") });

						if (orderItem) {
							orderItem.changeSelected(-1);

							var menuItem = MenuItems.findWhere({ id: orderItem.get("id") });

							if (menuItem) {
								menuItem.changeSelected(-1);
							}

							if (orderItem.get("selected") == 0) {
								OrderItems.remove(orderItem);

								this.render();
							}
						}
					}

					return (this);
				},
				//	Zero out the selected count of the menu items and reset the order items collection 
				zero: function (e) {
					var selected = MenuItems.selected();

					_.each(selected, function (model) {
						model.set("selected", 0);
					});

					OrderItems.reset();
				},
				//	Place the order and make payment ...
				done: function (e) {
					var content = this.order();

					content.paid = $(e.target).data("amount");

					alert(window.JSON.stringify(content));
				}
			});

		//	Create the application view which manually renders the checkout view.
		var MenuApp = new MenuAppView;

		//	Start up routing 
		Backbone.history.start();

	});
});
