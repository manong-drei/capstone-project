/**
 * seedDemoData.js
 * Run from server/ with:  node seedDemoData.js
 *
 * Populates demo doctors, staff, and patients for local testing.
 * Idempotent: skips any account whose phone number already exists in `users`.
 *
 * All seeded accounts share the password below and are NOT forced to
 * change it on first login (must_change_password = 0), so they're
 * immediately usable for testing.
 *
 * Does NOT seed an admin account — see server/src/seedAdmin.js (gitignored)
 * for the existing admin bootstrap flow.
 */

const bcrypt = require("bcryptjs");
const pool = require("./config/db");

const SEED_PASSWORD = "Test@1234";

const DOCTORS = [
  {
    phone: "09171234501",
    first_name: "Maria",
    last_name: "Santos",
    license_number: "PRC-DEN-00123",
    contact_number: "09171234501",
  },
  {
    phone: "09171234502",
    first_name: "Ramon",
    last_name: "Reyes",
    license_number: "PRC-DEN-00456",
    contact_number: "09171234502",
  },
];

const STAFF = [
  {
    phone: "09171234601",
    first_name: "Liza",
    last_name: "Cruz",
    position: "Nurse",
    contact_number: "09171234601",
  },
  {
    phone: "09171234602",
    first_name: "Noel",
    last_name: "Garcia",
    position: "Clerk",
    contact_number: "09171234602",
  },
];

// Helper: compute a birth date from age (relative to today)
function getDateOfBirthFromAge(age) {
  const today = new Date();
  const year = today.getFullYear() - age;
  const month = today.getMonth();
  const day = today.getDate();
  return new Date(year, month, day).toISOString().split("T")[0]; // YYYY-MM-DD
}

const PATIENTS = [
  {
    phone: "09171234701",
    first_name: "Ana",
    last_name: "Villanueva",
    date_of_birth: getDateOfBirthFromAge(28),
    gender: "Female",
    barangay: "Poblacion",
    priority_category: null,
  },
  {
    phone: "09171234702",
    first_name: "Jose",
    last_name: "Mercado",
    date_of_birth: getDateOfBirthFromAge(67),
    gender: "Male",
    barangay: "Abuanan",
    priority_category: "senior",
  },
  {
    phone: "09171234703",
    first_name: "Ella",
    last_name: "Torres",
    date_of_birth: getDateOfBirthFromAge(34),
    gender: "Female",
    barangay: "Dulao",
    priority_category: "pwd",
  },
  {
    phone: "09171234704",
    first_name: "Carla",
    last_name: "Ramos",
    date_of_birth: getDateOfBirthFromAge(24),
    gender: "Female",
    barangay: "Ilijan",
    priority_category: "pregnant",
  },
  // ---- 50 additional patients ----
  {
    phone: "09171234705",
    first_name: "Alfredo",
    last_name: "Navarro",
    date_of_birth: getDateOfBirthFromAge(55),
    gender: "Male",
    barangay: "Bacong",
    priority_category: null,
  },
  {
    phone: "09171234706",
    first_name: "Luzviminda",
    last_name: "Diaz",
    date_of_birth: getDateOfBirthFromAge(72),
    gender: "Female",
    barangay: "Bagroy",
    priority_category: "senior",
  },
  {
    phone: "09171234707",
    first_name: "Marco",
    last_name: "Panganiban",
    date_of_birth: getDateOfBirthFromAge(18),
    gender: "Male",
    barangay: "Balingasag",
    priority_category: null,
  },
  {
    phone: "09171234708",
    first_name: "Rosario",
    last_name: "Aquino",
    date_of_birth: getDateOfBirthFromAge(63),
    gender: "Female",
    barangay: "Binubuhan",
    priority_category: "senior",
  },
  {
    phone: "09171234709",
    first_name: "Emilio",
    last_name: "Sarmiento",
    date_of_birth: getDateOfBirthFromAge(41),
    gender: "Male",
    barangay: "Busay",
    priority_category: null,
  },
  {
    phone: "09171234710",
    first_name: "Divina",
    last_name: "Garcia",
    date_of_birth: getDateOfBirthFromAge(30),
    gender: "Female",
    barangay: "Calumangan",
    priority_category: "pregnant",
  },
  {
    phone: "09171234711",
    first_name: "Ramoncito",
    last_name: "Aguirre",
    date_of_birth: getDateOfBirthFromAge(58),
    gender: "Male",
    barangay: "Caridad",
    priority_category: null,
  },
  {
    phone: "09171234712",
    first_name: "Teresita",
    last_name: "Mendoza",
    date_of_birth: getDateOfBirthFromAge(49),
    gender: "Female",
    barangay: "Don Jorge Araneta",
    priority_category: null,
  },
  {
    phone: "09171234713",
    first_name: "Felipe",
    last_name: "Lopez",
    date_of_birth: getDateOfBirthFromAge(70),
    gender: "Male",
    barangay: "Dulao",
    priority_category: "senior",
  },
  {
    phone: "09171234714",
    first_name: "Imelda",
    last_name: "Reyes",
    date_of_birth: getDateOfBirthFromAge(27),
    gender: "Female",
    barangay: "Ilijan",
    priority_category: "pregnant",
  },
  {
    phone: "09171234715",
    first_name: "Gregorio",
    last_name: "Bautista",
    date_of_birth: getDateOfBirthFromAge(61),
    gender: "Male",
    barangay: "Lag-asan",
    priority_category: "senior",
  },
  {
    phone: "09171234716",
    first_name: "Socorro",
    last_name: "Salazar",
    date_of_birth: getDateOfBirthFromAge(35),
    gender: "Female",
    barangay: "Ma-ao",
    priority_category: "pwd",
  },
  {
    phone: "09171234717",
    first_name: "Renato",
    last_name: "Valdez",
    date_of_birth: getDateOfBirthFromAge(44),
    gender: "Male",
    barangay: "Mailum",
    priority_category: null,
  },
  {
    phone: "09171234718",
    first_name: "Leticia",
    last_name: "Castillo",
    date_of_birth: getDateOfBirthFromAge(66),
    gender: "Female",
    barangay: "Malingin",
    priority_category: "senior",
  },
  {
    phone: "09171234719",
    first_name: "Rodolfo",
    last_name: "Cruz",
    date_of_birth: getDateOfBirthFromAge(52),
    gender: "Male",
    barangay: "Napoles",
    priority_category: null,
  },
  {
    phone: "09171234720",
    first_name: "Angelita",
    last_name: "Ramos",
    date_of_birth: getDateOfBirthFromAge(29),
    gender: "Female",
    barangay: "Pacol",
    priority_category: "pregnant",
  },
  {
    phone: "09171234721",
    first_name: "Ernesto",
    last_name: "Flores",
    date_of_birth: getDateOfBirthFromAge(75),
    gender: "Male",
    barangay: "Poblacion",
    priority_category: "senior",
  },
  {
    phone: "09171234722",
    first_name: "Corazon",
    last_name: "Gonzales",
    date_of_birth: getDateOfBirthFromAge(40),
    gender: "Female",
    barangay: "Sagasa",
    priority_category: null,
  },
  {
    phone: "09171234723",
    first_name: "Arturo",
    last_name: "Torres",
    date_of_birth: getDateOfBirthFromAge(47),
    gender: "Male",
    barangay: "Sampinit",
    priority_category: null,
  },
  {
    phone: "09171234724",
    first_name: "Virginia",
    last_name: "Domingo",
    date_of_birth: getDateOfBirthFromAge(68),
    gender: "Female",
    barangay: "Tabunan",
    priority_category: "senior",
  },
  {
    phone: "09171234725",
    first_name: "Benjamin",
    last_name: "Villanueva",
    date_of_birth: getDateOfBirthFromAge(33),
    gender: "Male",
    barangay: "Taloc",
    priority_category: null,
  },
  {
    phone: "09171234726",
    first_name: "Norma",
    last_name: "Cabrera",
    date_of_birth: getDateOfBirthFromAge(25),
    gender: "Female",
    barangay: "Abuanan",
    priority_category: "pregnant",
  },
  {
    phone: "09171234727",
    first_name: "Eduardo",
    last_name: "Reyes",
    date_of_birth: getDateOfBirthFromAge(59),
    gender: "Male",
    barangay: "Alianza",
    priority_category: null,
  },
  {
    phone: "09171234728",
    first_name: "Josefina",
    last_name: "Pascual",
    date_of_birth: getDateOfBirthFromAge(71),
    gender: "Female",
    barangay: "Atipuluan",
    priority_category: "senior",
  },
  {
    phone: "09171234729",
    first_name: "Rogelio",
    last_name: "Jimenez",
    date_of_birth: getDateOfBirthFromAge(38),
    gender: "Male",
    barangay: "Bacong",
    priority_category: null,
  },
  {
    phone: "09171234730",
    first_name: "Margarita",
    last_name: "Aguilar",
    date_of_birth: getDateOfBirthFromAge(31),
    gender: "Female",
    barangay: "Bagroy",
    priority_category: "pregnant",
  },
  {
    phone: "09171234731",
    first_name: "Antonio",
    last_name: "Cortez",
    date_of_birth: getDateOfBirthFromAge(64),
    gender: "Male",
    barangay: "Balingasag",
    priority_category: "senior",
  },
  {
    phone: "09171234732",
    first_name: "Lourdes",
    last_name: "Sison",
    date_of_birth: getDateOfBirthFromAge(45),
    gender: "Female",
    barangay: "Binubuhan",
    priority_category: "pwd",
  },
  {
    phone: "09171234733",
    first_name: "Fernando",
    last_name: "Marquez",
    date_of_birth: getDateOfBirthFromAge(22),
    gender: "Male",
    barangay: "Busay",
    priority_category: null,
  },
  {
    phone: "09171234734",
    first_name: "Cecilia",
    last_name: "Ocampo",
    date_of_birth: getDateOfBirthFromAge(36),
    gender: "Female",
    barangay: "Calumangan",
    priority_category: null,
  },
  {
    phone: "09171234735",
    first_name: "Hilario",
    last_name: "Dela Cruz",
    date_of_birth: getDateOfBirthFromAge(77),
    gender: "Male",
    barangay: "Caridad",
    priority_category: "senior",
  },
  {
    phone: "09171234736",
    first_name: "Editha",
    last_name: "Manalo",
    date_of_birth: getDateOfBirthFromAge(26),
    gender: "Female",
    barangay: "Don Jorge Araneta",
    priority_category: "pregnant",
  },
  {
    phone: "09171234737",
    first_name: "Perfecto",
    last_name: "Ayson",
    date_of_birth: getDateOfBirthFromAge(56),
    gender: "Male",
    barangay: "Dulao",
    priority_category: null,
  },
  {
    phone: "09171234738",
    first_name: "Florencia",
    last_name: "Bautista",
    date_of_birth: getDateOfBirthFromAge(69),
    gender: "Female",
    barangay: "Ilijan",
    priority_category: "senior",
  },
  {
    phone: "09171234739",
    first_name: "Dominador",
    last_name: "Ramos",
    date_of_birth: getDateOfBirthFromAge(42),
    gender: "Male",
    barangay: "Lag-asan",
    priority_category: null,
  },
  {
    phone: "09171234740",
    first_name: "Adelaida",
    last_name: "Guevarra",
    date_of_birth: getDateOfBirthFromAge(37),
    gender: "Female",
    barangay: "Ma-ao",
    priority_category: "pwd",
  },
  {
    phone: "09171234741",
    first_name: "Maximo",
    last_name: "Mercado",
    date_of_birth: getDateOfBirthFromAge(73),
    gender: "Male",
    barangay: "Mailum",
    priority_category: "senior",
  },
  {
    phone: "09171234742",
    first_name: "Consuelo",
    last_name: "Lopez",
    date_of_birth: getDateOfBirthFromAge(46),
    gender: "Female",
    barangay: "Malingin",
    priority_category: null,
  },
  {
    phone: "09171234743",
    first_name: "Rolando",
    last_name: "Navarro",
    date_of_birth: getDateOfBirthFromAge(29),
    gender: "Male",
    barangay: "Napoles",
    priority_category: null,
  },
  {
    phone: "09171234744",
    first_name: "Gloria",
    last_name: "Castillo",
    date_of_birth: getDateOfBirthFromAge(32),
    gender: "Female",
    barangay: "Pacol",
    priority_category: "pregnant",
  },
  {
    phone: "09171234745",
    first_name: "Lorenzo",
    last_name: "Santos",
    date_of_birth: getDateOfBirthFromAge(60),
    gender: "Male",
    barangay: "Poblacion",
    priority_category: "senior",
  },
  {
    phone: "09171234746",
    first_name: "Carmencita",
    last_name: "Domingo",
    date_of_birth: getDateOfBirthFromAge(50),
    gender: "Female",
    barangay: "Sagasa",
    priority_category: null,
  },
  {
    phone: "09171234747",
    first_name: "Nicanor",
    last_name: "Garcia",
    date_of_birth: getDateOfBirthFromAge(65),
    gender: "Male",
    barangay: "Sampinit",
    priority_category: "senior",
  },
  {
    phone: "09171234748",
    first_name: "Zenaida",
    last_name: "Reyes",
    date_of_birth: getDateOfBirthFromAge(43),
    gender: "Female",
    barangay: "Tabunan",
    priority_category: "pwd",
  },
  {
    phone: "09171234749",
    first_name: "Vicente",
    last_name: "Aguirre",
    date_of_birth: getDateOfBirthFromAge(34),
    gender: "Male",
    barangay: "Taloc",
    priority_category: null,
  },
  {
    phone: "09171234750",
    first_name: "Aurora",
    last_name: "Pascual",
    date_of_birth: getDateOfBirthFromAge(27),
    gender: "Female",
    barangay: "Abuanan",
    priority_category: "pregnant",
  },
  {
    phone: "09171234751",
    first_name: "Feliciano",
    last_name: "Torres",
    date_of_birth: getDateOfBirthFromAge(79),
    gender: "Male",
    barangay: "Alianza",
    priority_category: "senior",
  },
  {
    phone: "09171234752",
    first_name: "Milagros",
    last_name: "Cruz",
    date_of_birth: getDateOfBirthFromAge(21),
    gender: "Female",
    barangay: "Atipuluan",
    priority_category: null,
  },
  {
    phone: "09171234753",
    first_name: "Ciriaco",
    last_name: "Sarmiento",
    date_of_birth: getDateOfBirthFromAge(48),
    gender: "Male",
    barangay: "Bacong",
    priority_category: null,
  },
  {
    phone: "09171234754",
    first_name: "Pacita",
    last_name: "Mendoza",
    date_of_birth: getDateOfBirthFromAge(62),
    gender: "Female",
    barangay: "Bagroy",
    priority_category: "senior",
  },
  // --- People born exactly 7 years ago ---
  {
    phone: "09171234755",
    first_name: "Liam",
    last_name: "Gonzaga",
    date_of_birth: getDateOfBirthFromAge(7), // born 7 years ago
    gender: "Male",
    barangay: "Poblacion",
    priority_category: null,
  },
  {
    phone: "09171234756",
    first_name: "Mia",
    last_name: "Roxas",
    date_of_birth: getDateOfBirthFromAge(7), // born 7 years ago
    gender: "Female",
    barangay: "Dulao",
    priority_category: null,
  },
];

async function phoneExists(phone) {
  const [[row]] = await pool.query(
    "SELECT user_id FROM users WHERE phone = ?",
    [phone],
  );
  return !!row;
}

async function getOrCreateSpecialization() {
  const [[existing]] = await pool.query(
    "SELECT specialization_id FROM specializations LIMIT 1",
  );
  if (existing) return existing.specialization_id;

  const [result] = await pool.query(
    "INSERT INTO specializations (specialization_name) VALUES (?)",
    ["General Dentistry"],
  );
  return result.insertId;
}

async function seedDoctors(specialization_id) {
  const created = [];
  for (const doc of DOCTORS) {
    if (await phoneExists(doc.phone)) {
      console.log(
        `  ⚠  Skipped doctor ${doc.first_name} ${doc.last_name} — phone already in use.`,
      );
      continue;
    }

    const password_hash = await bcrypt.hash(SEED_PASSWORD, 10);
    const [userResult] = await pool.query(
      `INSERT INTO users (phone, password_hash, role, must_change_password)
       VALUES (?, ?, 'doctor', 0)`,
      [doc.phone, password_hash],
    );
    const user_id = userResult.insertId;

    await pool.query(
      `INSERT INTO doctors (user_id, specialization_id, first_name, last_name, license_number, contact_number)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        specialization_id,
        doc.first_name,
        doc.last_name,
        doc.license_number,
        doc.contact_number,
      ],
    );

    created.push({
      role: "doctor",
      phone: doc.phone,
      name: `Dr. ${doc.first_name} ${doc.last_name}`,
    });
  }
  return created;
}

async function seedStaff() {
  const created = [];
  for (const s of STAFF) {
    if (await phoneExists(s.phone)) {
      console.log(
        `  ⚠  Skipped staff ${s.first_name} ${s.last_name} — phone already in use.`,
      );
      continue;
    }

    const password_hash = await bcrypt.hash(SEED_PASSWORD, 10);
    const [userResult] = await pool.query(
      `INSERT INTO users (phone, password_hash, role, must_change_password)
       VALUES (?, ?, 'staff', 0)`,
      [s.phone, password_hash],
    );
    const user_id = userResult.insertId;

    await pool.query(
      `INSERT INTO staff (user_id, first_name, last_name, position, contact_number)
       VALUES (?, ?, ?, ?, ?)`,
      [user_id, s.first_name, s.last_name, s.position, s.contact_number],
    );

    created.push({
      role: "staff",
      phone: s.phone,
      name: `${s.first_name} ${s.last_name}`,
    });
  }
  return created;
}

async function seedPatients() {
  const created = [];
  for (const p of PATIENTS) {
    if (await phoneExists(p.phone)) {
      console.log(
        `  ⚠  Skipped patient ${p.first_name} ${p.last_name} — phone already in use.`,
      );
      continue;
    }

    const priorityExpiresAt =
      p.priority_category === "pregnant"
        ? new Date(Date.now() + 280 * 24 * 60 * 60 * 1000)
        : null;

    const password_hash = await bcrypt.hash(SEED_PASSWORD, 10);
    const [userResult] = await pool.query(
      `INSERT INTO users (phone, password_hash, role, must_change_password)
       VALUES (?, ?, 'patient', 0)`,
      [p.phone, password_hash],
    );
    const user_id = userResult.insertId;

    // Insert using date_of_birth instead of age
    await pool.query(
      `INSERT INTO patients
         (user_id, first_name, last_name, date_of_birth, gender, contact_number, barangay, city, priority_category, priority_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id,
        p.first_name,
        p.last_name,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.barangay,
        "Bago City",
        p.priority_category,
        priorityExpiresAt,
      ],
    );

    created.push({
      role: "patient",
      phone: p.phone,
      name: `${p.first_name} ${p.last_name}`,
    });
  }
  return created;
}

async function seed() {
  console.log("\n🌱 Seeding demo data...\n");

  try {
    const specialization_id = await getOrCreateSpecialization();

    const doctors = await seedDoctors(specialization_id);
    const staff = await seedStaff();
    const patients = await seedPatients();

    const all = [...doctors, ...staff, ...patients];

    console.log(`\n✅ Seed complete. ${all.length} account(s) created.\n`);
    if (all.length > 0) {
      console.log("Login credentials (password is the same for all):");
      console.log(`  Password: ${SEED_PASSWORD}\n`);
      all.forEach((a) => {
        console.log(`  [${a.role.padEnd(7)}] ${a.phone}  —  ${a.name}`);
      });
      console.log("");
    }
  } catch (err) {
    console.error("\n❌ Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    pool.end();
  }
}

seed();
