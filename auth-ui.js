(function () {

    const box = document.getElementById("accountBox");
    if (!box) return;

    const TOKEN_KEY = "gamehub-token";

    function token() {
        return localStorage.getItem(TOKEN_KEY);
    }

    function esc(s) {
        const d = document.createElement("div");
        d.textContent = s == null ? "" : String(s);
        return d.innerHTML;
    }

    function renderLoggedOut(providers) {
        box.innerHTML =
            "<button id='accountToggle' class='acct-btn'>Sign in</button>" +
            "<div id='accountPanel' class='acct-panel' style='display:none'>" +
            (providers.passwordDb ?
                "<input type='email' id='acctEmail' placeholder='email'>" +
                "<input type='password' id='acctPass' placeholder='password'>" +
                "<button id='acctLogin' class='acct-btn'>Log in</button>" +
                "<button id='acctRegister' class='acct-btn'>Create account</button>" +
                "<p id='acctMsg'></p>" : "<p class='muted'>Account sign-in needs the database to be connected.</p>") +
            (providers.google ? "<a href='/api/auth/google'>Sign in with Google</a>" : "") +
            "</div>";

        const toggle = document.getElementById("accountToggle");
        const panel = document.getElementById("accountPanel");
        toggle.addEventListener("click", function () {
            panel.style.display = panel.style.display === "none" ? "block" : "none";
        });

        function submit(endpoint) {
            const email = document.getElementById("acctEmail").value.trim();
            const password = document.getElementById("acctPass").value;
            const msg = document.getElementById("acctMsg");

            if (!email || !password) {
                msg.textContent = "Enter email and password.";
                return;
            }

            msg.textContent = "...";
            fetch("/api/auth/" + endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email, password: password })
            })
                .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
                .then(function (out) {
                    if (out.status >= 400) {
                        msg.textContent = out.body.error || "Failed";
                        return;
                    }
                    localStorage.setItem(TOKEN_KEY, out.body.token);
                    syncLocalRig(out.body.token);
                    showLoggedIn(out.body.user);
                })
                .catch(function () { msg.textContent = "Network error - is the server running?"; });
        }

        const loginBtn = document.getElementById("acctLogin");
        const regBtn = document.getElementById("acctRegister");
        if (loginBtn) loginBtn.addEventListener("click", function () { submit("login"); });
        if (regBtn) regBtn.addEventListener("click", function () { submit("register"); });
    }

    function renderLoggedIn(email) {
        box.innerHTML =
            "<span class='acct-email'>" + esc(email) + "</span>" +
            "<button id='signOut' class='acct-btn'>Sign out</button>";
        document.getElementById("signOut").addEventListener("click", function () {
            localStorage.removeItem(TOKEN_KEY);
            location.reload();
        });
    }

    function showLoggedIn(user) {
        renderLoggedIn(user && user.email ? user.email : "gamer");
    }

    function syncLocalRig(jwtToken) {
        try {
            const raw = localStorage.getItem("gamehub-rig");
            if (!raw) return;
            const rig = JSON.parse(raw);
            fetch("/api/rigs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + jwtToken
                },
                body: JSON.stringify({
                    name: "My PC",
                    cpu: rig.cpu,
                    gpu: rig.gpu,
                    ram: Number(rig.ram)
                })
            }).catch(function () { return; });
        } catch (e) {
            return;
        }
    }

    fetch("/api/auth/providers")
        .then(function (r) { return r.json(); })
        .then(function (providers) {
            const t = token();
            if (!t) {
                renderLoggedOut(providers);
                return;
            }
            fetch("/api/auth/me", {
                headers: { Authorization: "Bearer " + t }
            })
                .then(function (r) {
                    if (!r.ok) throw new Error("stale");
                    return r.json();
                })
                .then(function (me) { renderLoggedIn(me.email); })
                .catch(function () {
                    localStorage.removeItem(TOKEN_KEY);
                    renderLoggedOut(providers);
                });
        })
        .catch(function () {
            box.style.display = "none";
        });

})();
