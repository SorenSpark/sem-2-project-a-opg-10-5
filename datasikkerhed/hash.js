const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcrypt");

async function run() {
  const usersPath = path.join(__dirname, "data", "users.json");

  // Salting håndteres automatisk af bcrypt.
  const password = "test1234";
  const saltRounds = 10;

  const passwordHash = await bcrypt.hash(password, saltRounds);

  const users = [
    { id: 1, username: "tobias", passwordHash },
    { id: 2, username: "alex", passwordHash },
  ];

  await fs.mkdir(path.join(__dirname, "data"), { recursive: true });
  await fs.mkdir(path.join(__dirname, "data", "profiles"), { recursive: true });

  await fs.writeFile(usersPath, JSON.stringify(users, null, 2), "utf8");

  // profilerne er separate filer (tekstfil-“database”)
  await fs.writeFile(
    path.join(__dirname, "data", "profiles", "1.json"),
    JSON.stringify(
      { id: 1, fullName: "Tobias Tagmos", email: "tobias5704@gmail.com", bio: "Jeg er studerende på IBA." },
      null,
      2
    ),
    "utf8"
  );

  await fs.writeFile(
    path.join(__dirname, "data", "profiles", "2.json"),
    JSON.stringify(
      { id: 2, fullName: "Alex", email: "alex@iba.dk", bio: "Jeg er ikke studerende på IBA." },
      null,
      2
    ),
    "utf8"
  );

  console.log("Seedet users.json + profiler. Login: tobias/test1234 eller alex/test1234");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});