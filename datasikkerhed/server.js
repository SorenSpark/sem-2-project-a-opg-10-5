const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const fs = require("node:fs/promises");
const path = require("node:path");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Form data (login)
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: "nuerjegendeligflyttettilvingestationsbyifrederikssundtakforforståelsen1707",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // beskytter session-cookie mod at blive læst af JS (XSS)
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60, // 1 time
    },
  })
);

// --------- "Database" (tekstfiler) ---------

async function readJson(filePath) {
  // central helper så vi ikke gentager fil-læsning overalt
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function getUsers() {
  return readJson(path.join(__dirname, "data", "users.json"));
}

async function getProfileByUserId(userId) {
  // vi accepterer kun et "rent" heltal-id, så user input ikke kan blive til en sti (path traversal)
  const safeId = Number(userId);
  if (!Number.isInteger(safeId)) return null;

  const profilePath = path.join(__dirname, "data", "profiles", `${safeId}.json`);
  try {
    return await readJson(profilePath);
  } catch {
    return null;
  }
}

// --------- Auth middleware ---------

function requireAuth(req, res, next) {
  // beskytter profilruten så kun autentificerede brugere får adgang
  if (!req.session.userId) return res.redirect("/login");
  next();
}

// --------- Routes ---------

app.get("/", (req, res) => {
  if (req.session.userId) return res.redirect("/profile");
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // simpel validering
  if (typeof username !== "string" || typeof password !== "string") {
    return res.render("login", { error: "Ugyldigt input." });
  }

  const users = await getUsers();
  const user = users.find((u) => u.username === username);

  // samme fejltekst uanset om brugeren findes eller ej (mindsker "user enumeration")
  if (!user) return res.render("login", { error: "Forkert login." });

  // compare mod hash (passwords lagres aldrig i klartekst)
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.render("login", { error: "Forkert login." });

  // gem kun userId i session
  req.session.userId = user.id;

  res.redirect("/profile");
});

app.post("/logout", (req, res) => {
  // ryd session, så brugeren reelt logges ud
  req.session.destroy(() => res.redirect("/login"));
});

app.get("/profile", requireAuth, async (req, res) => {
  // Vi bruger sessionens userId og ikke en url parameter.
  // Det stopper "IDOR" (at man kan se andres profiler via /profile/2 osv.)
  const profile = await getProfileByUserId(req.session.userId);

  if (!profile) return res.status(404).send("Profil ikke fundet.");

  res.render("profile", { profile });
});

app.listen(3000, () => {
  console.log("Server kører på http://localhost:3000");
});