function startApp() {

    const url = "https://baas.kinvey.com/";
    const appKey = "kid_r1cL6rSVx";
    const appSecret = "f615c6dd6e40454eaaee66b881af6673";
    const base64Auth = btoa(appKey + ":" + appSecret);
    const authHeaders = {"Authorization": "Basic " + base64Auth};

    $("form").submit(function (event) {
        event.preventDefault();
    });

    showHideLinks();
    showView("#viewHome");

    $("#infoBox, #errorBox").click(function () {

        $(this).hide();
    });

    function showInfo(info) {

        $("#infoBox").text(info);
        $("#infoBox").show();
        setTimeout(function () {
            $("#infoBox").fadeOut()
        }, 3000);
    }

    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show();
        },
        ajaxStop: function () {
            $("#loadingBox").hide();
        }
    });

    function showHideLinks() {

        if (sessionStorage.getItem("authToken")) {

            $("#linkHome").show();
            $("#linkCreateAd").show();
            $("#linkLogout").show();
            $("#linkAd").show();
            $("#linkRegister").hide();
            $("#linkLogin").hide();
        } else {
            $("#linkHome").show();
            $("#linkCreateAd").hide();
            $("#linkLogout").hide();
            $("#linkAd").hide();
            $("#linkRegister").show();
            $("#linkLogin").show();
        }
    }


    $("#linkHome").click(() => showView("#viewHome"));
    $("#linkLogin").click(() => showView("#viewLogin"));
    $("#linkRegister").click(() => showView("#viewRegister"));
    $("#linkCreateAd").click(() => showView("#viewCreateAd"));
    $("#linkAd").click(showAds);
    $("#formLogin").submit(login);
    $("#formRegister").submit(register);
    $("#linkLogout").click(logout);
    $("#formCreateAd").submit(create);
    $("#formEditAd").submit(editAd);

    function getKinveyAuth() {

        return {"Authorization": "Kinvey " + sessionStorage.getItem("authToken")};
    }

    function showView(selector) {

        $("main > section:not(#infoBox, loadingBox, errorBox)").hide();
        $(selector).show();
    }

    function sessionOperations(response) {

        sessionStorage.setItem("username", response.username);
        sessionStorage.setItem("authToken", response._kmd.authtoken);
        $("#loggedInUser").text("Welcome, " + sessionStorage.getItem("username")).show();
    }

    function login() {

        let username = $("#formLogin input[name=username]").val();
        let password = $("#formLogin input[name=passwd]").val();

        loginUser({"username": username, "password": password});
        $("#formLogin input[name=username]").val("");
        $("#formLogin input[name=passwd]").val("");

    }

    function loginUser(data) {

        $.post({
            url: url + "user/" + appKey + "/login",
            headers: authHeaders,
            data: data
        }).then(function (response) {

            showInfo("Login successful.");
            sessionOperations(response);
            showHideLinks();
            showView("#viewHome")

        }).catch(handleAjaxError)
    }


    function handleAjaxError(response) {

        if (response.readyState === 0) {
            throwError("No internet connection.")
        } else {
            throwError(response.responseJSON.description)
        }
    }

    function throwError(msg) {

        $("#errorBox").text(msg).show();
    }

    function logout() {

        $.post({
            url: url + "user/" + appKey + "/_logout",
            headers: getKinveyAuth()
        }).then(function () {

            showInfo("Logout successful.");
            $("#loggedInUser").text("");
            sessionStorage.clear();
            showHideLinks();
            showView("#viewHome");

        }).catch(handleAjaxError)
    }

    function register() {

        let username = $("#formRegister input[name=username]").val();
        let password = $("#formRegister input[name=passwd]").val();

        $("#formRegister input[name=username]").val("");
        $("#formRegister input[name=passwd]").val("");

        $.post({
            url: url + "user/" + appKey,
            headers: authHeaders,
            data: {"username": username, "password": password}
        }).then(function (response) {
            showInfo("Registration successful.");
            sessionOperations(response);
            showHideLinks();
            showView("#viewHome")
        });
    }

    function showAds() {

        showView("#viewAd");
        $("table .data").remove();

        $.get({
            url: url + "appdata/" + appKey + "/adverts",
            headers: getKinveyAuth()
        }).then(function (response) {

            for (let ad of response) {
                let tr = $("<tr class='data'>");
                tr.append($("<td>").text(ad.model));
                tr.append($("<td>").text(ad.publisher));

                if (ad.description.length > 60) {
                    tr.append($("<td>").text(ad.description.slice(0, 60) + "..."));
                } else {
                    tr.append($("<td>").text(ad.description));
                }

                tr.append($("<td>").text("$" + ad.price));
                tr.append($("<td>").text(formatDate(ad._kmd.lmt)));
                let td = $("<td>");
                td.append($("<a href='#'>").text("[VIEW]").click(() => showSingleAd(ad)));
                if (ad.publisher === sessionStorage.getItem("username")) {
                    td.append($("<a href='#'>").text("[EDIT]").click(() => fillEditData(ad)));
                    td.append($("<a href='#'>").text("[DELETE]").click(() => deleteAd(ad._id)));
                }
                tr.append(td);
                $("table").append(tr);
            }
        }).catch(handleAjaxError);
    }

    function create() {

        let model = $("#formCreateAd input[name=model]").val();
        let description = $("#formCreateAd textarea[name=description]").val();
        let img = $("#formCreateAd input[name=img]").val();
        let price = $("#formCreateAd input[name=price]").val();
        let publisher = sessionStorage.getItem("username");

        let adData = {
            "model": model,
            "description": description,
            "publisher": publisher,
            "price": price,
            "image": img
        };

        $.post({
            url: url + "appdata/" + appKey + "/adverts",
            headers: getKinveyAuth(),
            data: adData
        }).then(function () {
            showInfo("Ad created.");

            $("#formCreateAd input[name=model]").val("");
            $("#formCreateAd textarea[name=description]").val("");
            $("#formCreateAd input[name=img]").val("");
            $("#formCreateAd input[name=price]").val("");

            showAds();
        }).catch(handleAjaxError);
    }

    function deleteAd(id) {

        $.ajax({
            method: "DELETE",
            url: url + "appdata/" + appKey + "/adverts/" + id,
            headers: getKinveyAuth()
        }).then(function () {
            showInfo("Ad successfully deleted.");
            showAds();
        }).catch(handleAjaxError);
    }

    function fillEditData(ad) {

        showView("#viewEditAd");
        $("#formEditAd input[name=id]").val(ad._id);
        $("#formEditAd input[name=publisher]").val(ad.publisher);
        $("#formEditAd input[name=model]").val(ad.model);
        $("#formEditAd textarea[name=description]").val(ad.description);
        $("#formEditAd input[name=img]").val(ad.image);
        $("#formEditAd input[name=price]").val(ad.price);
    }

    function editAd() {

        let id = $("#formEditAd input[name=id]").val();
        let publisher = $("#formEditAd input[name=publisher]").val();
        let model = $("#formEditAd input[name=model]").val();
        let description = $("#formEditAd textarea[name=description]").val();
        let img = $("#formEditAd input[name=img]").val();
        let price = $("#formEditAd input[name=price]").val();

        let adData = {
            "model": model,
            "description": description,
            "publisher": publisher,
            "price": price,
            "image": img
        };

        $.ajax({
            method: "PUT",
            url: url + "appdata/" + appKey + "/adverts/" + id,
            headers: getKinveyAuth(),
            data: adData
        }).then(function () {
            showInfo("Edit successful.");
            showAds();
        }).catch(handleAjaxError);
    }

    function showSingleAd(ad) {

        showView("#viewSingleAd");
        if (ad.image) {
            $("#adImg").attr("src", ad.image);
        } else {
            $("#adImg").attr("src", "https://pbs.twimg.com/profile_images/600060188872155136/st4Sp6Aw.jpg");
        }

        $("#adModel").text(ad.model);
        $("#adDescription").text(ad.description);
        $("#adPublisher").text(ad.publisher);
        $("#adDate").text(formatDate(ad._kmd.lmt));
    }

    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))

            return '';
        return date.getDate() + "." + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + " " + date.getHours() + ":" +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }
}
