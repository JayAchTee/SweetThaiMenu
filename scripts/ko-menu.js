function formatCurrency(value)
{
	return ("$" + (parseFloat(value)).toFixed(2));
}

var MenuItem = function (item, menu)
{
	var self = this;

	self.menu = menu;

	self.id = ko.observable();
	self.category = ko.observable();
	self.item = ko.observable();
	self.description = ko.observable();
	self.options = ko.observableArray();
	self.option = ko.observable();
	self.price = ko.observable();
	self.isAvailable = ko.observable();
	self.ageVerify = ko.observable();
	//	Calculate what date occured 21 years ago for ID check purposes 
	self.dateValid = ko.pureComputed(function ()
	{
		var today = new Date();

		var valid = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate(), 0, 0, 0);

		return (valid.toLocaleDateString());
	});
	//	Does this menu item have options that must be selected?
	self.hasOptions = ko.pureComputed(function ()
	{
		return (((self.options) && (self.options() != null) && (self.options().length > 0)));
	});

	self.sameCategoryAs = function (index)
	{
		if (index() == 0)
		{
			return (false);
		}

		return (self.menu.menuItems()[index() - 1].category() == self.category());
	};

	//	Add the menu item to the order items by creating an OrderItem from the MenuItem object 
	self.addItemToOrder = function (item, e)
	{
		try 
		{
			//	Get a handle on the existing order item collection 
			var orderItems = self.menu.order.orderItems;

			//	If this menu item doesn't have any options ...
			if (!this.hasOptions())
			{
				//	... see if we can just bump the selected count on an existing order item 
				var item = _.find(orderItems(), function (item) { return (item.id() == self.id()); });

				//	... Yep ... bump up the selected count 
				if (item)
				{
					item.selected(item.selected() + 1);
				}
				//	... Nope ... create a new order item from myself 
				else
				{
					orderItems.push(new OrderItem(self));
				}
			}
			//	... we've got options so just create a new order item from myself 
			else
			{
				orderItems.push(new OrderItem(self, self.menu.order));
			}
		}
		catch (thrown)
		{
			alert("Whoa!  Something really bad happened (" + thrown + ").  Try that again, please!");
		}
	};

	//	Build myself from the JSON menu item if specified in the constructor 
	if (item)
	{
		self.id(item.id);
		self.category(item.category);
		self.item(item.item);
		self.description(item.description);
		self.options(item.options);
		self.price(parseFloat((parseFloat(item.price) / 100.00).toFixed(2)));
		self.isAvailable(item.isAvailable || true);
		self.ageVerify(item.ageVerify || false);
	};
};

var OrderItem = function (item)
{
	var self = this;

	self.id = ko.observable();
	self.category = ko.observable();
	self.item = ko.observable();
	self.description = ko.observable();
	self.options = ko.observableArray();
	self.price = ko.observable();
	self.isAvailable = ko.observable();
	self.ageVerify = ko.observable();
	//	Calculate what date occured 21 years ago for ID check purposes 
	self.dateValid = ko.pureComputed(function ()
	{
		var today = new Date();

		var valid = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate(), 0, 0, 0);

		return (valid.toLocaleDateString());
	});

	self.option = ko.observable();
	self.selected = ko.observable();

	//	Set the default selected count from the item passed or the default of 1 
	self.selected(((item != null && item.selected) ? item.selected() : null) || 1);

	//	Calculate the extended price of the order item 
	self.extendedPrice = ko.pureComputed(function ()
	{
		return (parseFloat(self.price()) * parseFloat(self.selected()));
	});

	//	Subtract one from this item but don't go less than zero (zero items are cleaned up in the Order model)
	self.lessOfMe = function ()
	{
		self.selected(self.selected() - 1);

		if (self.selected() > 0)
		{
			return;
		}

		self.selected(0);
	};

	//	Add one to this menu item (even if it has options)
	self.moreOfMe = function ()
	{
		self.selected(self.selected() + 1);
	};

	//	Build myself from the menu item (a MenuItem model) if specified in the constructor 
	if (item)
	{
		self.id(item.id());
		self.category(item.category());
		self.item(item.item());
		self.description(item.description());
		if (item.options)
		{
			self.options(item.options());
		}
		self.price(item.price());
		self.isAvailable(item.isAvailable() || true);
		self.ageVerify(item.ageVerify() || false);

		if (item.option)
		{
			self.option(item.option());
		}
	};
};

var Order = function ()
{
	var self = this;

	self.orderItems = ko.observableArray();
	self.percentTip = ko.observable(0.00);
	self.message = ko.observable();

	//	Count the number of items ordered and while I'm at it clean out any items that have zero selected values 
	self.itemsOrdered = ko.computed(function ()
	{
		//	Remove any order items where where the quantity is zero or less
		self.orderItems(_.reject(self.orderItems(), function (item) { return (item.selected() <= 0); }));

		//	... and count the remaing items 
		var count = 0;

		_.each(self.orderItems(), function (item) { count += item.selected() });

		return (count);
	}, this);

	//	Get the order subtotal before taxes and tip 
	self.subtotal = ko.pureComputed(function ()
	{
		//	Calculate the item(s) subtotal 
		var result = 0.00;

		_.each(self.orderItems(), function (item) { result += item.extendedPrice(); });

		return (result);
	});

	//	Get the order taxes 
	self.taxes = ko.pureComputed(function ()
	{
		//	Calculate the item(s) taxes 
		var result = 0.00;

		_.each(self.orderItems(), function (item) { result += item.extendedPrice(); });

		result = parseFloat((parseFloat(result) * 0.06).toFixed(2));

		return (result);
	});

	//	Get the order total (subtotal + taxes) ... useful for carry out orders because we don't get tips (mostly)
	self.total = ko.pureComputed(function ()
	{
		//	Calculate the items total including taxes 
		var result = 0.00;

		_.each(self.orderItems(), function (item) { result += item.extendedPrice(); });

		result += parseFloat((parseFloat(result) * 0.06).toFixed(2));

		return (result);
	});

	//	Get the order total (subtotal + taxes) with a 10% tip 
	self.totalWith10Tip = ko.pureComputed(function ()
	{
		//	Calculate the items total with a 10% tip and then include taxes 
		var result = 0.00;

		_.each(self.orderItems(), function (item) { result += item.extendedPrice(); });

		var taxes = parseFloat((parseFloat(result) * 0.06).toFixed(2));

		result = parseFloat(((result * 1.10) + taxes).toFixed(2));

		return (result);
	});

	//	Get the order total (subtotal + taxes) with a 15% tip 
	self.totalWith15Tip = ko.pureComputed(function ()
	{
		//	Calculate the items total with a 15% tip and then include taxes 
		var result = 0.00;

		_.each(self.orderItems(), function (item) { result += item.extendedPrice(); });

		var taxes = parseFloat((parseFloat(result) * 0.06).toFixed(2));

		result = parseFloat(((result * 1.15) + taxes).toFixed(2));

		return (result);
	});

	//	Get the order total (subtotal + taxes) with a 20% tip 
	self.totalWith20Tip = ko.pureComputed(function ()
	{
		//	Calculate the items total with a 20% tip and then include taxes 
		var result = 0.00;

		_.each(self.orderItems(), function (item) { result += item.extendedPrice(); });

		var taxes = parseFloat((parseFloat(result) * 0.06).toFixed(2));

		result = parseFloat(((result * 1.20) + taxes).toFixed(2));

		return (result);
	});
};

var Menu = function ()
{
	var self = this;

	self.menuItems = ko.observableArray();
	self.order = new Order();

	self.done = function (item, e)
	{
		if (confirm("Are you ready to place your order?"))
		{
			var percent = $(e.target).data("percent") || 0;

			var message = null;

			switch (percent)
			{
				case 10:
					message = "I am sorry you feel like you got poor service.";
					break;

				case 15:
					message = "It was a pleasure to have you visit us today!";
					break;

				case 20:
					message = "You are truly a generous patron!  Thank you.";
					break;

				default:
					message = "Come back now! Here?";
					break;
			}

			self.order.percentTip(percent);
			self.order.message(message);

			var data = ko.toJSON(self.order);

			$.post("http://localhost:8080/databases/SweetThaiOrders/docs", data, function (data, status)
			{
				alert(data.Key + ": " + status);

				if (status == "success")
				{
					self.clear(self, e);
				}
			});
		}

		return;
	};

	self.canSubmit = ko.pureComputed(function ()
	{
		return (self.order.orderItems().length != 0);
	});

	self.clear = function (item, e)
	{
		if ((e) && (e.target) && ($(arguments[1].target).data("confirm")))
		{
			if (!confirm($(arguments[1].target).data("confirm")))
			{
				return;
			}
		}

		this.order.orderItems([]);
	};

	$.when($.get("http://localhost:8080/databases/SweetThai/indexes/BasicStuff?&query=ID%3A*&pageSize=128&sort=Category&sort=Name")).then(function (data, status)
	{
		if (data.Results)
		{
			_.each(data.Results, function (item)
			{
				self.menuItems.push(new MenuItem(item, self));
			});
		}

		return;
	});
}

$(function ()
{
	var menu = new Menu();

	ko.applyBindings(menu);

	$(window).on("beforeunload", function (e)
	{
		try
		{
			if ((menu) && (menu.order.orderItems().length > 0))
			{
				return ("Are you sure you want to abandon your order?");
			}

			return;
		}
		catch (thrown)
		{
			return ("I can't tell if you've ordered.  Are you sure?");
		}
	});

});

