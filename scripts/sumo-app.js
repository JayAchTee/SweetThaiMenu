function guid()
{
	function s4()
	{
		return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
	}

	return (s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4());
}

$(document).ready(function ()
{
	$(document).delegate("[data-confirm]", "click", function (e)
	{
		var message = kendo.template($(e.target).data("confirm") || "Are you sure?");

		if (confirm(message({})))
		{
			return (true);
		}

		e.preventDefault();

		return (false);
	});

	$(document).delegate("[data-action]", "click", function (e)
	{
		var message = kendo.template($(e.target).data("prompt"));

		if (!confirm(message({})))
		{
			e.preventDefault();

			return (false);
		}

		var url = $(e.target).data("action");

		var settings = {
			cache: false,
			data: { key: $(e.target).data("id"), mode: 'json' },
			error: doneError,
			success: doneSuccess,
			url: url,
			xhrFields: { withCredentials: true }
		};

		$.ajax(settings);

		e.preventDefault();

		return (false);
	});

	$(".featured").first().each(function ()
	{
		$(".floater").show();

		$(".floater").click(function () { featured_Toggle() });
	});

	$(window).resize(window_Resize);

	window.setTimeout(window_Resize(null), 100);
});

function featured_Toggle(e)
{
	var state = $(".featured").css("display");

	switch (state)
	{
		default:
			$(".featured").slideDown();
			break;

		case "block":
			$(".featured").slideUp();
			break;
	}
}

function window_Resize(e)
{
	var $header = $("header");

	if (!$header)
	{
		return;
	}

	var $main = $("main >> .does-scroll");

	if (!$main.length)
	{
		$main = $("main");
	}

	if (!$main)
	{
		return;
	}

	var $footer = $("footer");

	if (!$footer)
	{
		return;
	}

	var h = window.innerHeight;

	if ($header.outerHeight() == 0)
	{
		h -= $header.children().outerHeight()
	}
	else
	{
		h -= $header.outerHeight()
	}

	h -= $footer.outerHeight();

	h -= 4;

	if (h > 64)
	{
		$main.outerHeight(h);

		$main.css("overflow-y", "scroll");
	}
	else
	{
		$main.css("overflow-y", "inherit");
	}
}

function notify(message, type)
{
	var notifier = $("#notifier").data("kendoNotification");

	if (notifier)
	{
		notifier.show(message, type || "info");
	}
}

function doneError(jqXHR, status, errorThrown)
{
	alert(errorThrown);
}

function doneSuccess(data, status, jqXHR)
{
	if (data)
	{
		if (data.row)
		{
			if (data.row.ID)
			{
				$("#id_" + data.row.ID).hide();
				$("#note_" + data.row.ID).hide();
			}
		}

		if (data.message)
		{
			alert(data.message);
		}

		return;
	}

	alert("Status: " + status);
}
