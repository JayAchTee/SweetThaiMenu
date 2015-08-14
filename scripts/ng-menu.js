var app = angular.module('menuApp', []);

app.controller('menuController', function ($scope, $http)
{
	$scope.menuItems = [];

	//	This is using a locahost RavenDB instance:
	//	http://localhost:8080/databases/SweetThai/indexes/BasicStuff?&query=ID%3A*&pageSize=128&sort=Category&sort=Name
	//	
	//	This is using a JSON file in the data subfolder:
	//	data / menu.json
	//	
	$http.get("http://localhost:8080/databases/SweetThai/indexes/BasicStuff?&query=ID%3A*&pageSize=128&sort=Category&sort=Name").success(function (data, status)
	{
		$scope.menuItems = data.Results;

		_.each($scope.menuItems, function (item)
		{
			item.selected = 0;
			item.price = (parseFloat(item.price) / 100.0).toFixed(2);
			item.extendedPriceEx = function () { return(((parseFloat(this.price) / 100.0) * this.selected).toFixed(2)); };
		});
	}).error(function (data, status)
	{
		if (data.Error)
		{
			alert(data.Error);
		}

		console.log("data error: " + status);
	});

	$scope.orderItems = [];

	$scope.categoryOf = function (index)
	{
		if ((index < 0) || (index > $scope.menuItems.length - 1))
		{
			return (null);
		}

		return ($scope.menuItems[index].category);
	};

	$scope.categoryLevelBreak = function ()
	{
		if (this.$index <= 0)
		{
			return (true);
		}

		return (this.item.category != $scope.menuItems[this.$index - 1].category);
	};

	$scope.taxRate = parseFloat("0.06");

	$scope.addToOrder = function (e)
	{
		var xp = this.item.extendedPriceEx();

		var item = JSON.parse(JSON.stringify(this.item));

		if (item.options)
		{
			item['$$hashKey'] = null;

			item.selected = 1;
			item.extendedPrice = (parseFloat(item.price) * item.selected).toFixed(2);
			item.option = this.option;

			$scope.orderItems.push(item);
		}
		else
		{
			var hit = _.findWhere($scope.orderItems, { id: item.id });

			if (hit)
			{
				hit.selected += 1;
				hit.extendedPrice = (parseFloat(hit.price) * hit.selected).toFixed(2);
			}
			else
			{
				item['$$hashKey'] = null;

				item.selected = 1;
				item.extendedPrice = (parseFloat(item.price) * item.selected).toFixed(2);
				item.option = this.option;

				$scope.orderItems.push(item);
			}
		}

		$scope.orderItems = _.sortBy($scope.orderItems, function (item)
		{
			return (item.category + ":" + item.item);
		});

		return;
	};

	$scope.bumpItemUp = function (e)
	{
		this.item.selected += 1;

		this.item.extendedPrice = (parseFloat(this.item.price) * this.item.selected).toFixed(2);

		return;
	};

	$scope.bumpItemDown = function (e)
	{
		if (this.item.selected > 0)
		{
			this.item.selected -= 1;

			if (this.item.selected == 0)
			{
				var remove = JSON.parse(JSON.stringify(this.item));

				$scope.orderItems = _.reject($scope.orderItems, function (item) { return (remove.$$hashKey == item.$$hashKey); });
			}

			this.item.extendedPrice = (parseFloat(this.item.price) * this.item.selected).toFixed(2);
		}

		return;
	};

	$scope.removeFromOrder = function (e)
	{
		var remove = JSON.parse(JSON.stringify(this.item));

		$scope.orderItems = _.reject($scope.orderItems, function (item) { return (remove.$$hashKey == item.$$hashKey); });

		return;
	};

	$scope.clearOrder = function (e)
	{
		if ($(e.target).data("confirm"))
		{
			if (confirm($(e.target).data("confirm")))
			{
				$scope.orderItems = [];
			}

			return;
		}

		$scope.orderItems = [];
	};

	$scope.orderSubTotal = function ()
	{
		var result = 0.00;

		_.each($scope.orderItems, function (item) { result += parseFloat(item.extendedPrice); });

		return (result.toFixed(2));
	};

	$scope.orderTaxes = function ()
	{
		var result = 0.00;

		_.each($scope.orderItems, function (item) { result += parseFloat(item.extendedPrice); });

		result *= $scope.taxRate;

		return (result.toFixed(2));
	};

	$scope.orderTotal = function ()
	{
		var result = 0.00;

		_.each($scope.orderItems, function (item) { result += parseFloat(item.extendedPrice); });

		result *= (1.00 + $scope.taxRate);

		return (result.toFixed(2));
	};

	$scope.orderSubTotalWith10 = function ()
	{
		var result = 0.00;

		_.each($scope.orderItems, function (item) { result += parseFloat(item.extendedPrice); });

		result *= 1.10;
		result += parseFloat($scope.orderTaxes());

		return (result.toFixed(2));
	};

	$scope.orderSubTotalWith15 = function ()
	{
		var result = 0.00;

		_.each($scope.orderItems, function (item) { result += parseFloat(item.extendedPrice); });

		result *= 1.15;
		result += parseFloat($scope.orderTaxes());

		return (result.toFixed(2));
	};

	$scope.orderSubTotalWith20 = function ()
	{
		var result = 0.00;

		_.each($scope.orderItems, function (item) { result += parseFloat(item.extendedPrice); });

		result *= 1.25;
		result += parseFloat($scope.orderTaxes());

		return (result.toFixed(2));
	};

	$scope.requiresAgeVerification = function (existing)
	{
		return (this.item.ageVerify ? existing + " bg-warning" : existing);
	};

	$scope.canAddItem = function ()
	{
		if (this.item.options)
		{
			if (this.option)
			{
				return (false);
			}

			return (true);
		}

		return (false);
	};

	$scope.canSubmit = function ()
	{
		return ($scope.orderItems.length > 0);
	};

	$scope.done = function (e)
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

		var order = JSON.stringify({ items: $scope.orderItems, tip: percent, message: message });

		if (confirm(order))
		{
			$http.post("http://localhost:8080/databases/SweetThaiOrders/docs", order);

			$scope.clearOrder(e);
		}
	};
});

app.directive('myMenuItem', function ()
{
	return (
		{
			restrict: 'E',
			templateUrl: 'templates/ng-menu-item.html'
		});
});

app.directive('myOrderItem', function ()
{
	return (
		{
			restrict: 'E',
			templateUrl: 'templates/ng-order-item.html'
		});
});
