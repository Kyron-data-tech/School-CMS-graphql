/**
 * Greenfield Academic AI Engine — Comprehensive Curriculum Question Banks
 * Covers Mathematics, Science (Physics, Chemistry, Biology), Social Science (History, Geography, Civics, Economics),
 * English, Computer Science, and Hindi, along with an intelligent topic-specific dynamic generator.
 */

export interface DomainQuizQuestion {
  q: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface TopicQuizBank {
  id: string;
  matches: (topicLower: string, subjectLower: string) => boolean;
  questions: DomainQuizQuestion[];
}

export function formatQuizResponse(
  subject: string,
  topic: string,
  gradeLevel: string,
  questions: DomainQuizQuestion[],
  questionCount: number
): string {
  const selected = questions.slice(0, Math.min(questionCount, questions.length));
  let text = `### 📝 Practice Quiz: ${subject} — ${topic} (${gradeLevel})\n\n`;
  selected.forEach((item, idx) => {
    text += `**Q${idx + 1}. ${item.q}**\n`;
    item.options.forEach((opt) => {
      text += `* ${opt}\n`;
    });
    text += `\n`;
  });
  text += `---\n\n### 🔑 Answer Key & Explanations:\n`;
  selected.forEach((item, idx) => {
    text += `${idx + 1}. **Answer: ${item.answer}** — ${item.explanation}\n`;
  });
  return text.trim();
}

export const DOMAIN_QUIZ_BANKS: TopicQuizBank[] = [
  // ==========================================
  // 1. MATHEMATICS
  // ==========================================
  {
    id: "math_probability",
    matches: (t) =>
      t.includes("probab") ||
      t.includes("chance") ||
      t.includes("dice") ||
      t.includes("coin") ||
      t.includes("card") ||
      t.includes("sample space") ||
      t.includes("outcome"),
    questions: [
      {
        q: "What is the standard mathematical formula used to calculate the theoretical probability of an event E, denoted as P(E)?",
        options: [
          "A) P(E) = (Number of outcomes favorable to E) / (Total number of possible outcomes in the sample space)",
          "B) P(E) = (Total number of possible outcomes) / (Number of favorable outcomes)",
          "C) P(E) = (Number of favorable outcomes) × (Total outcomes)",
          "D) P(E) = (Total outcomes) - (Number of favorable outcomes)",
        ],
        answer: "A",
        explanation: "Theoretical probability is calculated as the ratio of favorable outcomes to the total number of equally likely possible outcomes: P(E) = n(E) / n(S).",
      },
      {
        q: "If a fair, standard six-sided die is rolled once, what is the probability of rolling an even prime number?",
        options: [
          "A) 1/2",
          "B) 1/6",
          "C) 1/3",
          "D) 2/3",
        ],
        answer: "B",
        explanation: "The possible outcomes when rolling a six-sided die are {1, 2, 3, 4, 5, 6} (6 total outcomes). The only even prime number is 2 (1 favorable outcome). Therefore, P(even prime) = 1/6.",
      },
      {
        q: "Which of the following values can NEVER represent the probability of an event occurring?",
        options: [
          "A) 0",
          "B) 3/4 (or 0.75)",
          "C) 1.25",
          "D) 85%",
        ],
        answer: "C",
        explanation: "The probability of any event E always satisfies 0 ≤ P(E) ≤ 1 (or 0% to 100%). A probability value cannot be negative or strictly greater than 1 (such as 1.25).",
      },
      {
        q: "When two fair coins are tossed simultaneously, what is the probability of obtaining at least one Head?",
        options: [
          "A) 1/4",
          "B) 1/2",
          "C) 3/4",
          "D) 1",
        ],
        answer: "C",
        explanation: "The complete sample space for tossing two coins is {HH, HT, TH, TT} (4 total outcomes). The outcomes containing at least one Head are {HH, HT, TH} (3 favorable outcomes). Hence, P = 3/4.",
      },
      {
        q: "A single card is drawn at random from a well-shuffled standard deck of 52 playing cards. What is the probability of drawing a red Ace?",
        options: [
          "A) 1/52",
          "B) 2/52 (which simplifies to 1/26)",
          "C) 4/52 (which simplifies to 1/13)",
          "D) 1/4",
        ],
        answer: "B",
        explanation: "A standard deck contains 4 Aces, consisting of 2 black Aces (Spades, Clubs) and 2 red Aces (Hearts, Diamonds). Therefore, P(red Ace) = 2/52 = 1/26.",
      },
      {
        q: "If the probability of an event E occurring is P(E) = 0.35, what is the probability of its complementary event 'not E' occurring?",
        options: [
          "A) 0.35",
          "B) 0.65",
          "C) 1.35",
          "D) 0.70",
        ],
        answer: "B",
        explanation: "The sum of probabilities of an event and its complement is always 1: P(E) + P(not E) = 1. Therefore, P(not E) = 1 - 0.35 = 0.65.",
      },
      {
        q: "A bag contains 5 red balls, 3 blue balls, and 2 green balls. If one ball is drawn at random, what is the probability that it is NOT blue?",
        options: [
          "A) 3/10",
          "B) 7/10",
          "C) 1/2",
          "D) 2/5",
        ],
        answer: "B",
        explanation: "Total balls = 5 + 3 + 2 = 10. The number of balls that are not blue (red + green) = 5 + 2 = 7. Thus, P(not blue) = 7/10.",
      },
    ],
  },
  {
    id: "math_statistics",
    matches: (t) =>
      t.includes("stat") ||
      t.includes("mean") ||
      t.includes("median") ||
      t.includes("mode") ||
      t.includes("data handling") ||
      t.includes("frequency") ||
      t.includes("histogram") ||
      t.includes("bar graph") ||
      t.includes("pie chart"),
    questions: [
      {
        q: "How is the arithmetic mean of a set of N observations calculated?",
        options: [
          "A) (Sum of all observations) / (Total number of observations N)",
          "B) (Highest observation - Lowest observation) / 2",
          "C) The value that appears most frequently",
          "D) The middle observation when sorted",
        ],
        answer: "A",
        explanation: "The arithmetic mean is computed by summing all values and dividing by the total count: Mean = (Σx) / N.",
      },
      {
        q: "In a set of sorted numerical observations, what does the Median represent?",
        options: [
          "A) The arithmetic average of all values",
          "B) The middle-most value that divides the sorted data into two equal halves",
          "C) The observation occurring with the highest frequency",
          "D) The difference between extreme values",
        ],
        answer: "B",
        explanation: "When data is arranged in ascending or descending order, the median is the central observation.",
      },
      {
        q: "What is the Mode of the following data set: 4, 7, 9, 7, 3, 7, 5, 2?",
        options: [
          "A) 5.5",
          "B) 7",
          "C) 9",
          "D) 4",
        ],
        answer: "B",
        explanation: "The mode is the observation that appears with the highest frequency. Here, 7 appears 3 times, which is more than any other number.",
      },
      {
        q: "In descriptive statistics, what does the Range of a data set measure?",
        options: [
          "A) The difference between the maximum and minimum observations (Max - Min)",
          "B) The average distance of data points from the mean",
          "C) The sum of squares of deviations",
          "D) The center of mass of the frequency polygon",
        ],
        answer: "A",
        explanation: "The range measures statistical dispersion by subtracting the smallest observation from the largest observation.",
      },
      {
        q: "Which graphical representation uses adjacent continuous bars without gaps between them to represent grouped frequency distributions?",
        options: [
          "A) Simple Bar Graph",
          "B) Histogram",
          "C) Pie Chart",
          "D) Line Graph",
        ],
        answer: "B",
        explanation: "Histograms display continuous class intervals on the horizontal axis with adjacent bars whose heights represent frequency.",
      },
    ],
  },
  {
    id: "math_commercial",
    matches: (t) =>
      t.includes("percent") ||
      t.includes("profit") ||
      t.includes("loss") ||
      t.includes("interest") ||
      t.includes("discount") ||
      t.includes("ratio") ||
      t.includes("proportion"),
    questions: [
      {
        q: "What is the standard formula for calculating Simple Interest (SI) given Principal P, Rate R% per annum, and Time T years?",
        options: [
          "A) SI = (P × R × T) / 100",
          "B) SI = P × (1 + R/100)^T",
          "C) SI = (P + R + T) / 100",
          "D) SI = P × R × T",
        ],
        answer: "A",
        explanation: "Simple interest is calculated uniformly on the original principal: SI = (P × R × T) / 100.",
      },
      {
        q: "If an article with a Cost Price (CP) of ₹500 is sold for a Selling Price (SP) of ₹600, what is the Profit Percentage?",
        options: [
          "A) 10%",
          "B) 20%",
          "C) 25%",
          "D) 15%",
        ],
        answer: "B",
        explanation: "Profit = SP - CP = ₹600 - ₹500 = ₹100. Profit% = (Profit / CP) × 100 = (100 / 500) × 100 = 20%.",
      },
      {
        q: "How does Compound Interest (CI) fundamentally differ from Simple Interest (SI)?",
        options: [
          "A) In Compound Interest, interest is added to the principal periodically so that interest earns interest in subsequent periods",
          "B) Compound interest is always calculated only on the initial principal",
          "C) Compound interest rate decreases every year",
          "D) Simple interest produces greater returns over multi-year periods",
        ],
        answer: "A",
        explanation: "Compound interest compounds accumulated interest back into the principal for the next period: Amount = P(1 + R/100)^T.",
      },
      {
        q: "What is the Discount on an article having a Marked Price (MP) of ₹1,000 sold for a Selling Price (SP) of ₹850?",
        options: [
          "A) ₹150 (15% discount)",
          "B) ₹85 (8.5% discount)",
          "C) ₹100 (10% discount)",
          "D) ₹200 (20% discount)",
        ],
        answer: "A",
        explanation: "Discount = Marked Price - Selling Price = ₹1,000 - ₹850 = ₹150. Discount% = (150 / 1000) × 100 = 15%.",
      },
      {
        q: "In the proportion a : b = c : d, which fundamental property of proportions holds true?",
        options: [
          "A) Product of extremes equals product of means (a × d = b × c)",
          "B) a + d = b + c",
          "C) a / d = b / c",
          "D) a × b = c × d",
        ],
        answer: "A",
        explanation: "In any proportion a/b = c/d, cross-multiplying yields a × d = b × c.",
      },
    ],
  },
  {
    id: "math_geometry",
    matches: (t) =>
      t.includes("geometry") ||
      t.includes("mensuration") ||
      t.includes("surface area") ||
      t.includes("volume") ||
      t.includes("perimeter") ||
      t.includes("circle") ||
      t.includes("triangle") ||
      t.includes("quadrilateral") ||
      t.includes("polygon") ||
      t.includes("pythagor"),
    questions: [
      {
        q: "What is the formula for calculating the area of a circle with radius r?",
        options: [
          "A) 2πr",
          "B) πr²",
          "C) πd²/2",
          "D) 4/3 πr³",
        ],
        answer: "B",
        explanation: "The area enclosed by a circle of radius r is πr², whereas 2πr represents its circumference (perimeter).",
      },
      {
        q: "According to the Pythagorean Theorem, what is the relationship between the hypotenuse c and legs a, b in a right-angled triangle?",
        options: [
          "A) a + b = c",
          "B) a² + b² = c²",
          "C) a² - b² = c²",
          "D) 2a + 2b = c²",
        ],
        answer: "B",
        explanation: "In any right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides: a² + b² = c².",
      },
      {
        q: "What is the sum of the interior angles of a convex polygon with n sides?",
        options: [
          "A) (n - 2) × 180°",
          "B) n × 180°",
          "C) (n + 2) × 180°",
          "D) 360° / n",
        ],
        answer: "A",
        explanation: "Any convex n-sided polygon can be partitioned into (n - 2) non-overlapping triangles from a single vertex, making the sum of its interior angles (n - 2) × 180°.",
      },
      {
        q: "What is the formula for the volume of a right circular cylinder having radius r and height h?",
        options: [
          "A) 2πrh",
          "B) πr²h",
          "C) 1/3 πr²h",
          "D) 2πr(r + h)",
        ],
        answer: "B",
        explanation: "The volume of a cylinder is computed by multiplying the circular base area (πr²) by the height h: V = πr²h.",
      },
      {
        q: "If a triangle has a base of 10 cm and a perpendicular height of 6 cm, what is its area?",
        options: [
          "A) 60 cm²",
          "B) 30 cm²",
          "C) 16 cm²",
          "D) 45 cm²",
        ],
        answer: "B",
        explanation: "Area of a triangle = (1/2) × base × height = (1/2) × 10 × 6 = 30 cm².",
      },
    ],
  },
  {
    id: "math_trigonometry",
    matches: (t) =>
      t.includes("trig") ||
      /\b(sin|sine|cos|cosine|tan|tangent)\b/i.test(t) ||
      t.includes("coordinate"),
    questions: [
      {
        q: "In a right-angled triangle with acute angle θ, how is the sine ratio (sin θ) defined?",
        options: [
          "A) sin θ = (Side Opposite to θ) / (Hypotenuse)",
          "B) sin θ = (Side Adjacent to θ) / (Hypotenuse)",
          "C) sin θ = (Side Opposite to θ) / (Side Adjacent to θ)",
          "D) sin θ = (Hypotenuse) / (Side Opposite to θ)",
        ],
        answer: "A",
        explanation: "By trigonometric definition, sine is the ratio of the perpendicular opposite side to the hypotenuse.",
      },
      {
        q: "What is the value of the fundamental trigonometric identity sin²(θ) + cos²(θ) for any angle θ?",
        options: [
          "A) 0",
          "B) 1",
          "C) 2",
          "D) tan²(θ)",
        ],
        answer: "B",
        explanation: "By the Pythagorean trigonometric theorem, sin²(θ) + cos²(θ) = 1 universally for all real angles θ.",
      },
      {
        q: "What is the exact value of tan(45°)?",
        options: [
          "A) 0",
          "B) 1/2",
          "C) 1",
          "D) √3",
        ],
        answer: "C",
        explanation: "In an isosceles right-angled triangle (45°-45°-90°), the opposite and adjacent sides are equal in length, making tan(45°) = 1.",
      },
      {
        q: "What is the distance formula to find the length between two points (x₁, y₁) and (x₂, y₂) in a 2D Cartesian coordinate plane?",
        options: [
          "A) d = √[(x₂ - x₁)² + (y₂ - y₁)²]",
          "B) d = (x₂ - x₁) + (y₂ - y₁)",
          "C) d = (x₂ + x₁)² / (y₂ + y₁)²",
          "D) d = √[(x₂ + x₁)² - (y₂ + y₁)²]",
        ],
        answer: "A",
        explanation: "Derived from the Pythagorean theorem, the Euclidean distance is d = √[(x₂ - x₁)² + (y₂ - y₁)²].",
      },
    ],
  },
  {
    id: "math_exponents",
    matches: (t) =>
      t.includes("exponent") ||
      t.includes("power") ||
      t.includes("square root") ||
      t.includes("cube root") ||
      t.includes("radical") ||
      t.includes("rational"),
    questions: [
      {
        q: "According to the laws of exponents, what is the product of aᵐ and aⁿ for any non-zero base a?",
        options: [
          "A) aᵐ⁺ⁿ",
          "B) aᵐⁿ",
          "C) aᵐ⁻ⁿ",
          "D) (2a)ᵐ⁺ⁿ",
        ],
        answer: "A",
        explanation: "When multiplying exponential expressions with the same base, keep the base and add the exponents: aᵐ × aⁿ = aᵐ⁺ⁿ.",
      },
      {
        q: "For any non-zero real number a, what is the value of a⁰?",
        options: [
          "A) 0",
          "B) 1",
          "C) a",
          "D) Undefined",
        ],
        answer: "B",
        explanation: "By exponent laws (aⁿ / aⁿ = aⁿ⁻ⁿ = a⁰ = 1), any non-zero number raised to the zero power equals 1.",
      },
      {
        q: "What is the principal square root of 144, denoted as √144?",
        options: [
          "A) 11",
          "B) 12",
          "C) 14",
          "D) 72",
        ],
        answer: "B",
        explanation: "Since 12 × 12 = 144, the principal (positive) square root of 144 is 12.",
      },
      {
        q: "Which of the following numbers is an irrational number?",
        options: [
          "A) 0.75",
          "B) 2/3",
          "C) √2",
          "D) √16",
        ],
        answer: "C",
        explanation: "√2 cannot be expressed as the ratio of two integers p/q, making it an irrational number. √16 simplifies to 4 (rational).",
      },
      {
        q: "What is the simplified value of (2³)²?",
        options: [
          "A) 2⁵ = 32",
          "B) 2⁶ = 64",
          "C) 2⁹ = 512",
          "D) 12",
        ],
        answer: "B",
        explanation: "Using the power of a power rule (aᵐ)ⁿ = aᵐⁿ, we have (2³)² = 2⁶ = 64.",
      },
    ],
  },
  {
    id: "math_algebra",
    matches: (t) =>
      t.includes("algebra") ||
      t.includes("linear") ||
      t.includes("equation") ||
      t.includes("variable") ||
      t.includes("quadratic") ||
      t.includes("polynomial"),
    questions: [
      {
        q: "What is the standard procedure to solve a linear equation for an unknown variable x?",
        options: [
          "A) Balancing the equation by applying identical inverse operations to both sides",
          "B) Guessing and substituting values without validation",
          "C) Removing terms arbitrarily from the left side",
          "D) Multiplying only one side by zero",
        ],
        answer: "A",
        explanation: "Maintaining mathematical equality requires applying balanced inverse operations across both sides of the equation to isolate the unknown variable.",
      },
      {
        q: "Which algebraic property justifies that a(b + c) = ab + ac?",
        options: [
          "A) Associative Property",
          "B) Distributive Property of Multiplication over Addition",
          "C) Commutative Property",
          "D) Identity Property",
        ],
        answer: "B",
        explanation: "The Distributive Property allows multiplying a single outer term across each term in a parenthetical sum.",
      },
      {
        q: "In a linear equation of the form y = mx + c, what does the parameter m represent?",
        options: [
          "A) The y-intercept where the line crosses the vertical axis",
          "B) The slope or rate of change (rise over run)",
          "C) The total area under the linear curve",
          "D) The x-intercept",
        ],
        answer: "B",
        explanation: "The slope m measures the steepness and direction of a line, defined by the ratio of vertical change (rise) to horizontal change (run).",
      },
      {
        q: "What defines a Linear Equation in one variable?",
        options: [
          "A) The highest power (degree) of the unknown variable is exactly 1",
          "B) The equation must contain two or more variables multiplied together",
          "C) The equation must contain squared terms x²",
          "D) The variable must appear inside a square root",
        ],
        answer: "A",
        explanation: "A linear equation in one variable has the general form ax + b = 0 (where a ≠ 0), with variable degree exactly equal to 1.",
      },
      {
        q: "If 3x + 5 = 20, what is the value of x?",
        options: [
          "A) 3",
          "B) 5",
          "C) 7",
          "D) 15",
        ],
        answer: "B",
        explanation: "Subtract 5 from both sides: 3x = 15. Divide both sides by 3: x = 5.",
      },
    ],
  },
  {
    id: "math_general",
    matches: (_, s) => s.includes("math"),
    questions: [
      {
        q: "When evaluating or simplifying problems in this mathematical topic, which standard hierarchy of operational precedence must be maintained?",
        options: [
          "A) Standard Order of Operations (BODMAS/PEMDAS: Brackets/Parentheses, Orders/Exponents, Division & Multiplication, Addition & Subtraction)",
          "B) Arbitrary left-to-right evaluation ignoring groupings",
          "C) Performing all addition before evaluating parentheses",
          "D) Randomized evaluation order",
        ],
        answer: "A",
        explanation: "Universal mathematical conventions require following the standard order of operations (BODMAS/PEMDAS) across all expressions.",
      },
      {
        q: "What constitutes rigorous mathematical verification for a derived solution?",
        options: [
          "A) Re-substituting the calculated value into the original constraints to verify equality",
          "B) Choosing a plausible approximation without checking",
          "C) Modifying the original problem parameters",
          "D) Relying solely on visual estimation",
        ],
        answer: "A",
        explanation: "Verifying mathematical solutions requires checking calculated values against the original equations and constraints.",
      },
      {
        q: "What distinguishes a deductive mathematical proof from an empirical observation?",
        options: [
          "A) A proof uses deductive logical reasoning to establish universal validity across all permissible inputs",
          "B) A proof applies to only one specific trial",
          "C) A proof is based on survey consensus",
          "D) A proof cannot be tested",
        ],
        answer: "A",
        explanation: "In mathematics, proofs establish universal deductive truth under formal axioms.",
      },
    ],
  },

  // ==========================================
  // 2. SCIENCE — PHYSICS
  // ==========================================
  {
    id: "sci_physics_force",
    matches: (t) =>
      t.includes("force") ||
      t.includes("motion") ||
      t.includes("newton") ||
      t.includes("friction") ||
      t.includes("inertia") ||
      t.includes("speed") ||
      t.includes("velocity"),
    questions: [
      {
        q: "What does Newton's First Law of Motion (Law of Inertia) state?",
        options: [
          "A) An object remains at rest or in uniform straight-line motion unless acted upon by a net external unbalanced force",
          "B) Acceleration is inversely proportional to net force",
          "C) Every action has an unequal opposite reaction",
          "D) Friction is always zero in a vacuum",
        ],
        answer: "A",
        explanation: "Inertia is the inherent tendency of an object to resist changes in its state of rest or motion unless compelled by an external net force.",
      },
      {
        q: "Which mathematical formula represents Newton's Second Law of Motion relating Force (F), Mass (m), and Acceleration (a)?",
        options: [
          "A) F = m × a",
          "B) F = m / a",
          "C) F = m + a",
          "D) F = a / m",
        ],
        answer: "A",
        explanation: "Newton's Second Law defines net force as the product of mass and acceleration: F = ma (measured in Newtons).",
      },
      {
        q: "What type of contact force acts parallel to surfaces in contact and opposes relative motion?",
        options: [
          "A) Gravitational force",
          "B) Frictional force",
          "C) Electrostatic force",
          "D) Magnetic force",
        ],
        answer: "B",
        explanation: "Frictional force arises from microscopic surface irregularities and always opposes relative motion between contacting bodies.",
      },
      {
        q: "According to Newton's Third Law of Motion, action and reaction forces:",
        options: [
          "A) Are equal in magnitude, opposite in direction, and act on two different bodies simultaneously",
          "B) Act on the same object and cancel each other out completely",
          "C) Occur with a slight time delay",
          "D) Have different magnitudes depending on velocity",
        ],
        answer: "A",
        explanation: "Newton's Third Law states that every action force produces an equal and opposite reaction force acting on different interacting objects.",
      },
    ],
  },
  {
    id: "sci_physics_light",
    matches: (t) =>
      t.includes("light") ||
      t.includes("optic") ||
      t.includes("reflect") ||
      t.includes("refract") ||
      t.includes("mirror") ||
      t.includes("lens"),
    questions: [
      {
        q: "According to the Law of Reflection, what is the exact relationship between the angle of incidence (∠i) and angle of reflection (∠r)?",
        options: [
          "A) Angle of incidence equals angle of reflection (∠i = ∠r)",
          "B) Angle of incidence is twice the angle of reflection (∠i = 2∠r)",
          "C) Angle of incidence is always 90°",
          "D) ∠i + ∠r = 180°",
        ],
        answer: "A",
        explanation: "The first law of reflection states that the angle of incidence is always equal to the angle of reflection (∠i = ∠r), measured from the normal.",
      },
      {
        q: "What phenomenon causes a straight pencil immersed partially in a glass of water to appear bent at the water surface?",
        options: [
          "A) Total Internal Reflection",
          "B) Refraction of light due to speed change across different optical media",
          "C) Absorption of photons",
          "D) Dispersion of white light",
        ],
        answer: "B",
        explanation: "Refraction is the bending of light rays as they transition between optical media of differing densities due to changes in wave speed.",
      },
      {
        q: "What is the speed of light in a vacuum?",
        options: [
          "A) Approximately 3 × 10⁸ meters per second (300,000 km/s)",
          "B) 340 meters per second",
          "C) 3 × 10⁵ meters per second",
          "D) Infinite speed",
        ],
        answer: "A",
        explanation: "In a vacuum, electromagnetic light waves travel at the universal constant c ≈ 3.0 × 10⁸ m/s.",
      },
      {
        q: "Which optical device splits incoming white sunlight into a spectrum of seven colors (VIBGYOR)?",
        options: [
          "A) Plane mirror",
          "B) Glass prism (Dispersion)",
          "C) Concave mirror",
          "D) Dark polarization filter",
        ],
        answer: "B",
        explanation: "A glass prism disperses white light into its constituent spectral colors because different wavelengths bend at slightly different angles.",
      },
    ],
  },
  {
    id: "sci_physics_electricity",
    matches: (t) =>
      t.includes("electric") ||
      t.includes("circuit") ||
      t.includes("current") ||
      t.includes("magnet") ||
      t.includes("ohm") ||
      t.includes("voltage"),
    questions: [
      {
        q: "What is the mathematical formulation of Ohm's Law relating Potential Difference (V), Current (I), and Resistance (R)?",
        options: [
          "A) V = I × R",
          "B) V = I / R",
          "C) V = I + R",
          "D) I = V × R",
        ],
        answer: "A",
        explanation: "Ohm's Law states that current through a conductor between two points is directly proportional to voltage: V = IR.",
      },
      {
        q: "What is the SI unit of electrical resistance?",
        options: [
          "A) Ampere (A)",
          "B) Ohm (Ω)",
          "C) Volt (V)",
          "D) Watt (W)",
        ],
        answer: "B",
        explanation: "Electrical resistance is measured in Ohms (Ω), representing opposition to electron flow.",
      },
      {
        q: "In a series electric circuit, which electrical property remains identical across all connected components?",
        options: [
          "A) Electric Current (I)",
          "B) Voltage drop across each resistor",
          "C) Resistance of each bulb",
          "D) Power dissipation",
        ],
        answer: "A",
        explanation: "In a series circuit, there is only one path for charges, so current is uniform throughout the entire circuit.",
      },
      {
        q: "How do two like magnetic poles (such as two North poles) interact when brought close to each other?",
        options: [
          "A) They attract strongly",
          "B) They repel each other",
          "C) They neutralize each other",
          "D) No force is exerted",
        ],
        answer: "B",
        explanation: "Like magnetic poles repel, while unlike poles (North and South) attract.",
      },
    ],
  },
  {
    id: "sci_physics_sound",
    matches: (t) =>
      t.includes("sound") ||
      t.includes("wave") ||
      t.includes("vibrat") ||
      t.includes("pitch") ||
      t.includes("frequency") ||
      t.includes("acoustic"),
    questions: [
      {
        q: "Why can sound waves NOT travel through a complete vacuum?",
        options: [
          "A) Sound is a mechanical wave requiring a material medium of particles to transmit vibrations",
          "B) Vacuums absorb sound frequencies completely",
          "C) Sound waves travel faster than light in a vacuum",
          "D) Sound requires sunlight to propagate",
        ],
        answer: "A",
        explanation: "Sound waves propagate via mechanical vibrations of particles; without material particles in a vacuum, sound cannot propagate.",
      },
      {
        q: "Which acoustic property of a sound wave determines its Pitch?",
        options: [
          "A) Amplitude",
          "B) Frequency (measured in Hertz)",
          "C) Speed of sound",
          "D) Direction of propagation",
        ],
        answer: "B",
        explanation: "Frequency (vibrations per second) determines sound pitch; higher frequency results in a higher-pitched sound.",
      },
      {
        q: "What is the typical audible frequency range for the average human ear?",
        options: [
          "A) 20 Hz to 20,000 Hz (20 kHz)",
          "B) 1 Hz to 100 Hz",
          "C) 20,000 Hz to 100,000 Hz",
          "D) 0 Hz to 10 Hz",
        ],
        answer: "A",
        explanation: "Human hearing ranges from roughly 20 Hz (deepest bass) to 20,000 Hz (highest treble).",
      },
      {
        q: "In which state of matter does sound travel fastest?",
        options: [
          "A) Solids (due to tightly packed particles)",
          "B) Liquids",
          "C) Gases",
          "D) Vacuum",
        ],
        answer: "A",
        explanation: "Sound travels fastest through solids because closely packed molecular bonds transmit vibrational energy most efficiently.",
      },
    ],
  },
  {
    id: "sci_physics_energy",
    matches: (t) =>
      t.includes("gravit") ||
      t.includes("energy") ||
      t.includes("work") ||
      t.includes("kinetic") ||
      t.includes("heat") ||
      t.includes("thermodynamic"),
    questions: [
      {
        q: "According to the Law of Conservation of Energy, which statement is universally true?",
        options: [
          "A) Energy cannot be created or destroyed; it can only be transformed from one form to another",
          "B) Energy is created during chemical reactions",
          "C) Total energy in an isolated system decreases over time",
          "D) Kinetic energy is always greater than potential energy",
        ],
        answer: "A",
        explanation: "The first law of thermodynamics states that total energy of an isolated system remains constant; energy merely changes form.",
      },
      {
        q: "Which mathematical formula calculates the Kinetic Energy (KE) of an object with mass m moving at velocity v?",
        options: [
          "A) KE = (1/2) × m × v²",
          "B) KE = m × v",
          "C) KE = m × g × h",
          "D) KE = (1/2) × m² × v",
        ],
        answer: "A",
        explanation: "Kinetic energy of motion is given by KE = 1/2 m v² (measured in Joules).",
      },
      {
        q: "What is the approximate acceleration due to gravity (g) near Earth's surface?",
        options: [
          "A) 9.8 m/s²",
          "B) 3.14 m/s²",
          "C) 100 m/s²",
          "D) 1.6 m/s²",
        ],
        answer: "A",
        explanation: "Standard acceleration due to gravity on Earth is approximately 9.8 m/s².",
      },
    ],
  },

  // ==========================================
  // 3. SCIENCE — CHEMISTRY
  // ==========================================
  {
    id: "sci_chem_acids_bases",
    matches: (t) =>
      /\b(acid|acids|acidic)\b/i.test(t) ||
      (/\b(base|bases|basic|alkali|alkaline)\b/i.test(t) && !t.includes("database")) ||
      /\b(salt|salts)\b/i.test(t) ||
      /\bph\b/i.test(t) ||
      t.includes("litmus"),
    questions: [
      {
        q: "On the standard pH scale ranging from 0 to 14, what pH value corresponds to a neutral solution at 25°C?",
        options: [
          "A) pH = 0",
          "B) pH = 7",
          "C) pH = 14",
          "D) pH = 3.5",
        ],
        answer: "B",
        explanation: "Pure water at 25°C has equal hydrogen and hydroxide ion concentrations, corresponding to a neutral pH of exactly 7.",
      },
      {
        q: "How does blue litmus paper behave when tested in an acidic solution?",
        options: [
          "A) Turns red",
          "B) Turns green",
          "C) Remains blue",
          "D) Turns completely colorless",
        ],
        answer: "A",
        explanation: "Acids turn blue litmus paper red, while alkaline (basic) substances turn red litmus paper blue.",
      },
      {
        q: "What products are universally formed in a typical acid-base Neutralization reaction?",
        options: [
          "A) Salt and Water",
          "B) Pure Hydrogen gas and Oxygen",
          "C) Carbon dioxide only",
          "D) Pure metallic elements",
        ],
        answer: "A",
        explanation: "When an acid reacts with a base, they neutralize each other to produce a chemical salt and water: Acid + Base -> Salt + Water.",
      },
      {
        q: "Which fundamental scientific law requires that chemical equations be balanced on both reactant and product sides?",
        options: [
          "A) Law of Definite Proportions",
          "B) Law of Conservation of Mass",
          "C) Boyle's Law",
          "D) Avogadro's Principle",
        ],
        answer: "B",
        explanation: "The Law of Conservation of Mass states that mass cannot be created or destroyed in a chemical reaction; atoms must be equal on both sides.",
      },
    ],
  },
  {
    id: "sci_chem_reactions",
    matches: (t) =>
      t.includes("reaction") ||
      t.includes("metal") ||
      t.includes("non-metal") ||
      t.includes("rust") ||
      t.includes("combustion"),
    questions: [
      {
        q: "Which property allows metals to be beaten into thin sheets without breaking?",
        options: [
          "A) Malleability",
          "B) Ductility",
          "C) Sonorousness",
          "D) Brittleness",
        ],
        answer: "A",
        explanation: "Malleability is the property of metals allowing them to be hammered or rolled into thin sheets (e.g., gold foil, aluminum foil).",
      },
      {
        q: "Which two environmental factors are essential for the rusting of iron?",
        options: [
          "A) Oxygen and Water (Moisture)",
          "B) Pure Nitrogen and Sunlight",
          "C) Carbon dioxide and Heat only",
          "D) Hydrogen gas and Oil",
        ],
        answer: "A",
        explanation: "Rusting requires both oxygen (from air) and water/moisture to form hydrated iron oxide Fe₂O₃·xH₂O.",
      },
      {
        q: "What occurs during an Exothermic chemical reaction?",
        options: [
          "A) Thermal energy is released into the surroundings",
          "B) Thermal energy is continuously absorbed",
          "C) Mass of the reactants increases",
          "D) Temperature of the reaction vessel drops to zero",
        ],
        answer: "A",
        explanation: "Exothermic reactions release energy into their surroundings, typically in the form of heat or light.",
      },
    ],
  },
  {
    id: "sci_chem_atomic",
    matches: (t) =>
      t.includes("atom") ||
      t.includes("periodic") ||
      t.includes("bond") ||
      t.includes("molecule") ||
      t.includes("electron"),
    questions: [
      {
        q: "Which subatomic particle carries a negative electric charge and orbits the atomic nucleus?",
        options: [
          "A) Proton",
          "B) Neutron",
          "C) Electron",
          "D) Alpha particle",
        ],
        answer: "C",
        explanation: "Electrons have a negative charge (-1) and occupy orbitals surrounding the dense, positively charged nucleus.",
      },
      {
        q: "In the Modern Periodic Table, elements are arranged in order of increasing:",
        options: [
          "A) Atomic number (number of protons in the nucleus)",
          "B) Atomic mass",
          "C) Physical density",
          "D) Year of discovery",
        ],
        answer: "A",
        explanation: "Moseley's Modern Periodic Law arranges elements by increasing atomic number Z, which governs chemical periodicity.",
      },
      {
        q: "What type of chemical bond is formed when electrons are shared between two non-metal atoms?",
        options: [
          "A) Covalent Bond",
          "B) Ionic Bond (Electrovalent)",
          "C) Metallic Bond",
          "D) Hydrogen Bond only",
        ],
        answer: "A",
        explanation: "Covalent bonds form when pairs of valence electrons are shared between atoms to complete their octets.",
      },
    ],
  },
  {
    id: "sci_chem_matter",
    matches: (t) =>
      t.includes("matter") ||
      t.includes("solid") ||
      t.includes("liquid") ||
      t.includes("gas") ||
      t.includes("evaporat") ||
      t.includes("sublimat"),
    questions: [
      {
        q: "What is the process called when a solid changes directly into a gas without passing through the liquid state?",
        options: [
          "A) Sublimation (e.g., Camphor, Dry Ice)",
          "B) Condensation",
          "C) Evaporation",
          "D) Solidification",
        ],
        answer: "A",
        explanation: "Sublimation is the direct phase change from solid to gas without entering an intermediate liquid phase.",
      },
      {
        q: "Why does evaporation of a liquid cause a cooling sensation?",
        options: [
          "A) Higher-energy molecules escape, absorbing latent heat of vaporization from the surface",
          "B) Surrounding air freezes instantly",
          "C) Condensation warms the container",
          "D) Liquid particles stop vibrating",
        ],
        answer: "A",
        explanation: "Evaporation draws latent heat from the remaining liquid and surface, lowering temperature.",
      },
    ],
  },

  // ==========================================
  // 4. SCIENCE — BIOLOGY
  // ==========================================
  {
    id: "sci_bio_cells",
    matches: (t) =>
      t.includes("cell") ||
      t.includes("photo") ||
      t.includes("chloroplast") ||
      t.includes("mitochondria"),
    questions: [
      {
        q: "Which cellular organelle is known as the 'powerhouse of the cell' for synthesizing ATP during cellular respiration?",
        options: [
          "A) Endoplasmic Reticulum",
          "B) Mitochondria",
          "C) Golgi Apparatus",
          "D) Lysosome",
        ],
        answer: "B",
        explanation: "Mitochondria produce cellular adenosine triphosphate (ATP) via aerobic cellular respiration.",
      },
      {
        q: "What are the primary chemical reactants consumed during photosynthesis in green plants?",
        options: [
          "A) Carbon dioxide (CO₂) and Water (H₂O) in the presence of sunlight and chlorophyll",
          "B) Glucose and Oxygen only",
          "C) Nitrogen gas and Methane",
          "D) Pure Carbon Monoxide",
        ],
        answer: "A",
        explanation: "Plants utilize carbon dioxide and water with light energy absorbed by chlorophyll to synthesize glucose and release oxygen.",
      },
      {
        q: "Which structural feature is present in plant cells but absent in animal cells?",
        options: [
          "A) Rigid Cellulose Cell Wall and Chloroplasts",
          "B) Mitochondria",
          "C) Cell membrane",
          "D) Ribosomes",
        ],
        answer: "A",
        explanation: "Plant cells feature a rigid outer cell wall made of cellulose and chloroplasts for photosynthesis, neither of which exists in animal cells.",
      },
    ],
  },
  {
    id: "sci_bio_physiology",
    matches: (t) =>
      t.includes("digest") ||
      t.includes("circulat") ||
      t.includes("heart") ||
      t.includes("blood") ||
      t.includes("respirat") ||
      t.includes("lung") ||
      t.includes("nerv") ||
      t.includes("brain") ||
      t.includes("organ"),
    questions: [
      {
        q: "Which component of human blood contains the iron-rich protein hemoglobin responsible for carrying oxygen?",
        options: [
          "A) Red Blood Cells (Erythrocytes)",
          "B) White Blood Cells (Leukocytes)",
          "C) Blood Platelets (Thrombocytes)",
          "D) Blood Plasma",
        ],
        answer: "A",
        explanation: "Red blood cells contain hemoglobin, which binds oxygen molecules in the lungs and delivers them across tissues.",
      },
      {
        q: "In the human digestive system, where does the majority of nutrient absorption into the bloodstream occur?",
        options: [
          "A) Stomach",
          "B) Small Intestine (via Villi)",
          "C) Large Intestine",
          "D) Esophagus",
        ],
        answer: "B",
        explanation: "The small intestine features millions of tiny finger-like projections called villi that greatly increase surface area for nutrient absorption.",
      },
      {
        q: "Where does gas exchange (oxygen uptake and carbon dioxide release) take place in the human respiratory system?",
        options: [
          "A) Alveoli in the lungs",
          "B) Trachea",
          "C) Bronchi",
          "D) Larynx",
        ],
        answer: "A",
        explanation: "Alveoli are microscopic air sacs surrounded by capillaries where gas diffusion occurs between air and blood.",
      },
    ],
  },
  {
    id: "sci_bio_genetics",
    matches: (t) =>
      t.includes("gene") ||
      t.includes("dna") ||
      t.includes("heredity") ||
      t.includes("inherit") ||
      t.includes("mendel"),
    questions: [
      {
        q: "Who is universally recognized as the 'Father of Genetics' for formulating the fundamental laws of inheritance?",
        options: [
          "A) Gregor Mendel",
          "B) Charles Darwin",
          "C) Louis Pasteur",
          "D) Alexander Fleming",
        ],
        answer: "A",
        explanation: "Gregor Mendel discovered the fundamental principles of inheritance through systematic breeding experiments on pea plants (Pisum sativum).",
      },
      {
        q: "How many pairs of chromosomes are present in a normal human somatic cell?",
        options: [
          "A) 23 pairs (46 chromosomes total)",
          "B) 46 pairs",
          "C) 12 pairs",
          "D) 32 pairs",
        ],
        answer: "A",
        explanation: "Human somatic cells contain 23 pairs of chromosomes: 22 pairs of autosomes and 1 pair of sex chromosomes (XX or XY).",
      },
    ],
  },
  {
    id: "sci_bio_ecology",
    matches: (t) =>
      t.includes("ecolog") ||
      t.includes("food chain") ||
      t.includes("ecosystem") ||
      t.includes("biodivers") ||
      t.includes("environment"),
    questions: [
      {
        q: "In an ecological food chain, what approximate percentage of energy is transferred from one trophic level to the next higher level?",
        options: [
          "A) Approximately 10% (Lindeman's 10% Law)",
          "B) 50%",
          "C) 90%",
          "D) 100%",
        ],
        answer: "A",
        explanation: "Only about 10% of chemical energy from food is incorporated into organic matter at the next trophic level; 90% is lost as metabolic heat.",
      },
      {
        q: "What role do autotrophs (green plants) perform in an ecosystem?",
        options: [
          "A) Primary Producers that convert solar energy into chemical food energy",
          "B) Decomposers",
          "C) Tertiary consumers",
          "D) Parasites",
        ],
        answer: "A",
        explanation: "Autotrophs produce organic food from inorganic substances via photosynthesis, forming the base of the food web.",
      },
    ],
  },
  {
    id: "sci_general",
    matches: (_, s) => s.includes("science"),
    questions: [
      {
        q: "In scientific inquiry, what is the purpose of conducting a controlled experiment?",
        options: [
          "A) To test the effect of changing a single independent variable while keeping all other variables constant",
          "B) To verify outcomes without measurements",
          "C) To produce inconsistent results",
          "D) To change multiple variables simultaneously",
        ],
        answer: "A",
        explanation: "Controlled experiments isolate the relationship between independent and dependent variables by maintaining constant control factors.",
      },
      {
        q: "What distinguishes an empirical scientific theory from an untested hypothesis?",
        options: [
          "A) A theory is supported by extensive reproducible experimental evidence and predictive power",
          "B) A theory is an initial educated guess",
          "C) A theory requires no verification",
          "D) A hypothesis has already been conclusively proven",
        ],
        answer: "A",
        explanation: "Scientific theories represent thoroughly tested explanations corroborated by repeated empirical observations and experiments.",
      },
    ],
  },

  // ==========================================
  // 5. SOCIAL SCIENCE — HISTORY
  // ==========================================
  {
    id: "hist_freedom_movement",
    matches: (t) =>
      t.includes("freedom") ||
      t.includes("national movement") ||
      t.includes("gandhi") ||
      t.includes("satyagraha") ||
      t.includes("independence"),
    questions: [
      {
        q: "In which year did Mahatma Gandhi lead the historic Salt March (Dandi March) to protest the British colonial salt monopoly?",
        options: [
          "A) 1930 (Civil Disobedience Movement)",
          "B) 1920",
          "C) 1942",
          "D) 1919",
        ],
        answer: "A",
        explanation: "The Salt Satyagraha began on March 12, 1930, from Sabarmati Ashram to Dandi, initiating the Civil Disobedience Movement.",
      },
      {
        q: "What resolution was passed by the Indian National Congress in August 1942 calling for immediate British withdrawal?",
        options: [
          "A) Quit India Resolution",
          "B) Non-Cooperation Resolution",
          "C) Swadeshi Resolution",
          "D) Poona Pact",
        ],
        answer: "A",
        explanation: "The Quit India Movement was launched in August 1942 at Gowalia Tank Maidan with Gandhi's call to 'Do or Die'.",
      },
      {
        q: "Which massacre in April 1919 in Amritsar led Rabindranath Tagore to renounce his British Knighthood?",
        options: [
          "A) Jallianwala Bagh Massacre",
          "B) Chauri Chaura incident",
          "C) Kakori incident",
          "D) Meerut Uprising",
        ],
        answer: "A",
        explanation: "General Dyer ordered troops to fire on unarmed demonstrators in Jallianwala Bagh on April 13, 1919, killing hundreds.",
      },
    ],
  },
  {
    id: "hist_1857",
    matches: (t) =>
      t.includes("1857") ||
      t.includes("sepoy") ||
      t.includes("mutiny") ||
      t.includes("mangal pandey"),
    questions: [
      {
        q: "Where did the first armed revolt of the Indian Rebellion of 1857 officially break out on May 10, 1857?",
        options: [
          "A) Meerut",
          "B) Delhi",
          "C) Barrackpore",
          "D) Kanpur",
        ],
        answer: "A",
        explanation: "The sepoys at Meerut broke into open rebellion on May 10, 1857, and marched to Delhi to proclaim Bahadur Shah Zafar as leader.",
      },
      {
        q: "What major constitutional transformation followed the suppression of the 1857 revolt under the Government of India Act 1858?",
        options: [
          "A) Direct rule of the British Crown replaced the East India Company",
          "B) Complete Indian independence was granted",
          "C) The Mughal Empire was reinstated",
          "D) Partition of Bengal",
        ],
        answer: "A",
        explanation: "The British Crown assumed direct governance of India from the British East India Company via the Queen's Proclamation of 1858.",
      },
    ],
  },
  {
    id: "hist_french_revolution",
    matches: (t) =>
      t.includes("french") ||
      t.includes("bastille") ||
      t.includes("revolution") ||
      t.includes("napoleon"),
    questions: [
      {
        q: "Which landmark event on July 14, 1789, is celebrated as the dawn of the French Revolution?",
        options: [
          "A) Storming of the Bastille prison fortress",
          "B) Execution of Louis XVI",
          "C) Coronation of Napoleon",
          "D) Battle of Waterloo",
        ],
        answer: "A",
        explanation: "The storming of the Bastille symbolised the overthrow of royal tyranny and absolute monarchy in France.",
      },
      {
        q: "What enduring political slogan was popularized during the French Revolution?",
        options: [
          "A) Liberty, Equality, Fraternity (Liberté, égalité, fraternité)",
          "B) Peace, Land, and Bread",
          "C) Workers of the world unite",
          "D) Blood and Iron",
        ],
        answer: "A",
        explanation: "The core philosophical values of the French Revolution were encapsulated in the motto 'Liberty, Equality, Fraternity'.",
      },
    ],
  },
  {
    id: "hist_mughal",
    matches: (t) =>
      t.includes("mughal") ||
      t.includes("akbar") ||
      t.includes("babar") ||
      t.includes("sultan") ||
      t.includes("delhi"),
    questions: [
      {
        q: "Who founded the Mughal Empire in India by defeating Ibrahim Lodi at the First Battle of Panipat in 1526?",
        options: [
          "A) Babur",
          "B) Akbar",
          "C) Humayun",
          "D) Jahangir",
        ],
        answer: "A",
        explanation: "Zahir-ud-din Muhammad Babur defeated the Delhi Sultanate at Panipat in 1526 using advanced field artillery.",
      },
      {
        q: "Which administrative ranking and military organization system was introduced by Emperor Akbar?",
        options: [
          "A) Mansabdari System",
          "B) Jagirdari System",
          "C) Ryotwari System",
          "D) Mahalwari System",
        ],
        answer: "A",
        explanation: "Akbar organized civil and military administration through the Mansabdari system, fixing salaries and ranks (zat and sawar).",
      },
    ],
  },
  {
    id: "hist_ancient",
    matches: (t) =>
      t.includes("indus") ||
      t.includes("harapp") ||
      t.includes("mohenjo") ||
      t.includes("ancient") ||
      t.includes("civiliz"),
    questions: [
      {
        q: "What was the most prominent architectural and engineering hallmark of the Indus Valley Civilization (Harappan Culture)?",
        options: [
          "A) Advanced urban grid planning with covered underground drainage systems",
          "B) Massive stone pyramids",
          "C) Iron weapons and war chariots",
          "D) Fortified sea harbors across northern deserts",
        ],
        answer: "A",
        explanation: "Harappa and Mohenjo-daro featured grid town layouts, baked brick houses, and sophisticated covered drainage networks.",
      },
      {
        q: "At which Indus Valley site was the famous 'Great Bath' discovered?",
        options: [
          "A) Mohenjo-daro",
          "B) Lothal",
          "C) Kalibangan",
          "D) Dholavira",
        ],
        answer: "A",
        explanation: "The Great Bath, a watertight public bathing structure built with bitumen and baked brick, was excavated at Mohenjo-daro.",
      },
    ],
  },

  // ==========================================
  // 6. SOCIAL SCIENCE — GEOGRAPHY
  // ==========================================
  {
    id: "geog_climate",
    matches: (t) =>
      t.includes("climate") ||
      t.includes("weather") ||
      t.includes("atmosphere") ||
      t.includes("season") ||
      t.includes("zone"),
    questions: [
      {
        q: "In which layer of Earth's atmosphere do virtually all weather phenomena (clouds, rainfall, winds) occur?",
        options: [
          "A) Troposphere",
          "B) Stratosphere",
          "C) Mesosphere",
          "D) Thermosphere",
        ],
        answer: "A",
        explanation: "The troposphere is the lowest atmospheric layer containing ~75% of atmospheric mass and all active weather systems.",
      },
      {
        q: "Which thermal zone on Earth receives maximum direct solar insolation throughout the year?",
        options: [
          "A) Torrid Zone (between Tropic of Cancer and Tropic of Capricorn)",
          "B) North Temperate Zone",
          "C) South Frigid Zone",
          "D) Polar Ice Caps",
        ],
        answer: "A",
        explanation: "The Torrid Zone spans between 23.5° N and 23.5° S, receiving perpendicular midday sun rays and maximum heat.",
      },
    ],
  },
  {
    id: "geog_tectonics",
    matches: (t) =>
      t.includes("volcano") ||
      t.includes("earthquake") ||
      t.includes("plate") ||
      t.includes("tectonic") ||
      t.includes("seismic") ||
      t.includes("tsunami"),
    questions: [
      {
        q: "What is the point on Earth's surface located directly above the underground seismic focus of an earthquake?",
        options: [
          "A) Epicenter",
          "B) Fault line",
          "C) Crater",
          "D) Magma chamber",
        ],
        answer: "A",
        explanation: "The epicenter is the surface point vertically above the subterranean focus (hypocenter) where seismic energy originates.",
      },
      {
        q: "Which scientific instrument records seismic ground vibrations during an earthquake?",
        options: [
          "A) Seismograph",
          "B) Barometer",
          "C) Anemometer",
          "D) Hygrometer",
        ],
        answer: "A",
        explanation: "A seismograph (seismometer) detects and measures seismic wave amplitudes generated by tectonic movements.",
      },
    ],
  },
  {
    id: "geog_solar_system",
    matches: (t) =>
      t.includes("solar") ||
      t.includes("planet") ||
      t.includes("rotat") ||
      t.includes("revolut") ||
      t.includes("latitude") ||
      t.includes("longitude"),
    questions: [
      {
        q: "What causes the alternate cycle of day and night on Earth?",
        options: [
          "A) Earth's rotation on its axis from west to east every 24 hours",
          "B) Earth's revolution around the Sun",
          "C) Moon's orbit around Earth",
          "D) Changes in solar flares",
        ],
        answer: "A",
        explanation: "Axial rotation of Earth exposes different hemispheres to sunlight over a 24-hour period, producing day and night.",
      },
      {
        q: "What is the imaginary line of 0° latitude that divides Earth into Northern and Southern Hemispheres?",
        options: [
          "A) The Equator",
          "B) Prime Meridian",
          "C) Tropic of Cancer",
          "D) Arctic Circle",
        ],
        answer: "A",
        explanation: "The Equator is the central parallel of latitude equidistant from the North and South Poles at 0°.",
      },
    ],
  },
  {
    id: "geog_agriculture",
    matches: (t) =>
      t.includes("soil") ||
      t.includes("crop") ||
      t.includes("agricultur") ||
      t.includes("forest") ||
      t.includes("mineral"),
    questions: [
      {
        q: "Which fertile soil type covers the vast northern river plains of India, deposited by the Indus, Ganga, and Brahmaputra?",
        options: [
          "A) Alluvial Soil",
          "B) Black Soil (Regur)",
          "C) Laterite Soil",
          "D) Arid Desert Soil",
        ],
        answer: "A",
        explanation: "Alluvial soil is rich in potash, phosphoric acid, and lime, making it the most agriculturally productive soil in India.",
      },
      {
        q: "What distinguishes Kharif crops from Rabi crops in the Indian agricultural calendar?",
        options: [
          "A) Kharif crops are sown at the beginning of the monsoon (June-July) and harvested in autumn (e.g., Rice, Maize)",
          "B) Kharif crops are grown exclusively during winter months",
          "C) Rabi crops require monsoon flooding",
          "D) Wheat is a Kharif crop while rice is a Rabi crop",
        ],
        answer: "A",
        explanation: "Kharif crops depend on monsoon rainfall, while Rabi crops are winter crops (wheat, barley, gram) sown in October-December.",
      },
    ],
  },

  // ==========================================
  // 7. SOCIAL SCIENCE — CIVICS & POLITICS
  // ==========================================
  {
    id: "civics_constitution",
    matches: (t) =>
      t.includes("constitution") ||
      t.includes("fundamental right") ||
      t.includes("preamble") ||
      t.includes("duty"),
    questions: [
      {
        q: "Who was the Chairman of the Drafting Committee of the Indian Constitution?",
        options: [
          "A) Dr. B.R. Ambedkar",
          "B) Jawaharlal Nehru",
          "C) Mahatma Gandhi",
          "D) Dr. Rajendra Prasad",
        ],
        answer: "A",
        explanation: "Dr. Bhimrao Ramji Ambedkar chaired the committee that drafted the Constitution of India.",
      },
      {
        q: "On which date did the Constitution of India officially come into full legal effect, celebrated as Republic Day?",
        options: [
          "A) January 26, 1950",
          "B) August 15, 1947",
          "C) November 26, 1949",
          "D) October 2, 1950",
        ],
        answer: "A",
        explanation: "Adopted on 26 Nov 1949, the Constitution was enacted on 26 Jan 1950 to honor the 1930 Purna Swaraj declaration.",
      },
      {
        q: "Which constitutional article was described by Dr. B.R. Ambedkar as the 'heart and soul of the Constitution'?",
        options: [
          "A) Article 32 (Right to Constitutional Remedies)",
          "B) Article 14 (Equality before Law)",
          "C) Article 21 (Right to Life)",
          "D) Article 19 (Freedom of Speech)",
        ],
        answer: "A",
        explanation: "Article 32 allows citizens to petition the Supreme Court directly via writs if fundamental rights are violated.",
      },
    ],
  },
  {
    id: "civics_parliament",
    matches: (t) =>
      t.includes("parliament") ||
      t.includes("democracy") ||
      t.includes("lok sabha") ||
      t.includes("rajya sabha") ||
      t.includes("judiciar") ||
      t.includes("court") ||
      t.includes("panchayat") ||
      t.includes("election"),
    questions: [
      {
        q: "In the bicameral Parliament of India, which house is directly elected by the adult citizens of the nation?",
        options: [
          "A) Lok Sabha (House of the People)",
          "B) Rajya Sabha (Council of States)",
          "C) Vidhan Parishad",
          "D) NITI Aayog",
        ],
        answer: "A",
        explanation: "Lok Sabha members are directly elected by eligible voters through universal adult suffrage every 5 years.",
      },
      {
        q: "What is the minimum voting age for Indian citizens established by the 61st Constitutional Amendment?",
        options: [
          "A) 18 years",
          "B) 21 years",
          "C) 25 years",
          "D) 16 years",
        ],
        answer: "A",
        explanation: "The 61st Amendment Act of 1988 reduced the voting age from 21 to 18 years for parliamentary and assembly elections.",
      },
      {
        q: "What constitutes the apex authority of the independent judicial hierarchy in India?",
        options: [
          "A) The Supreme Court of India",
          "B) The High Courts",
          "C) The Ministry of Law and Justice",
          "D) The Parliament",
        ],
        answer: "A",
        explanation: "The Supreme Court of India is the highest judicial court and final court of appeal under the Constitution.",
      },
    ],
  },

  // ==========================================
  // 8. SOCIAL SCIENCE — ECONOMICS
  // ==========================================
  {
    id: "econ_money_banking",
    matches: (t) =>
      t.includes("money") ||
      t.includes("bank") ||
      t.includes("credit") ||
      t.includes("rbi") ||
      t.includes("currency") ||
      t.includes("sector") ||
      t.includes("econom") ||
      t.includes("gdp"),
    questions: [
      {
        q: "Which regulatory central bank in India has the sole authority to issue currency notes on behalf of the central government?",
        options: [
          "A) Reserve Bank of India (RBI)",
          "B) State Bank of India (SBI)",
          "C) Ministry of Commerce",
          "D) SEBI",
        ],
        answer: "A",
        explanation: "The Reserve Bank of India (RBI) serves as the nation's central monetary authority issuing legal currency.",
      },
      {
        q: "Which sector of the economy comprises services such as transportation, banking, education, and information technology?",
        options: [
          "A) Tertiary Sector (Service Sector)",
          "B) Primary Sector",
          "C) Secondary Sector (Industrial)",
          "D) Quaternary Mining Sector",
        ],
        answer: "A",
        explanation: "The tertiary sector generates services rather than physical goods, supporting agriculture and industrial production.",
      },
    ],
  },

  // ==========================================
  // 9. ENGLISH LANGUAGE & LITERATURE
  // ==========================================
  {
    id: "eng_active_passive",
    matches: (t, s) =>
      t.includes("active") ||
      t.includes("passive") ||
      (t.includes("voice") && (s.includes("english") || t.includes("grammar"))),
    questions: [
      {
        q: "What distinguishes Active Voice from Passive Voice in English grammar?",
        options: [
          "A) In Active Voice the grammatical subject performs the action; in Passive Voice the subject receives the action",
          "B) Active Voice cannot contain past tense verbs",
          "C) Passive Voice can never include the preposition 'by'",
          "D) Active Voice only applies to questions",
        ],
        answer: "A",
        explanation: "In active voice, the subject acts (e.g. 'The teacher praised Rohit'); in passive voice, the subject is acted upon ('Rohit was praised by the teacher').",
      },
      {
        q: "What is the correct passive voice transformation of: 'She wrote an inspiring novel'?",
        options: [
          "A) An inspiring novel was written by her",
          "B) An inspiring novel is written by her",
          "C) An inspiring novel had been written by her",
          "D) An inspiring novel was being written by she",
        ],
        answer: "A",
        explanation: "Simple past active ('wrote') transforms into 'was/were + past participle' ('was written').",
      },
    ],
  },
  {
    id: "eng_speech",
    matches: (t, s) =>
      t.includes("indirect") ||
      t.includes("reported") ||
      (t.includes("speech") && s.includes("english")),
    questions: [
      {
        q: "When converting Direct Speech into Indirect (Reported) Speech, what change typically occurs?",
        options: [
          "A) Quotation marks are omitted, pronouns adjust, and present tenses undergo backshifting into past tenses",
          "B) Tenses always shift to future tense",
          "C) Quotation marks are retained",
          "D) The reporting clause is deleted",
        ],
        answer: "A",
        explanation: "Reported speech removes quotation marks and shifts back verb tenses (e.g., 'I am tired' -> 'he said that he was tired').",
      },
      {
        q: "How does the adverb of time 'today' typically shift in reported speech?",
        options: [
          "A) 'That day'",
          "B) 'The following week'",
          "C) 'Yesterday'",
          "D) Remains unchanged as 'today'",
        ],
        answer: "A",
        explanation: "In reported speech, time expressions shift relative to the speaker (e.g., 'today' becomes 'that day', 'tomorrow' becomes 'the next day').",
      },
    ],
  },
  {
    id: "eng_tenses",
    matches: (t, s) =>
      t.includes("tense") ||
      t.includes("agreement") ||
      (t.includes("verb") && s.includes("english")),
    questions: [
      {
        q: "Which verb tense correctly expresses an action that began in the past and continues into the present moment?",
        options: [
          "A) Present Perfect Continuous Tense (e.g., 'They have been playing for two hours')",
          "B) Simple Past Tense",
          "C) Past Perfect Tense",
          "D) Simple Future Tense",
        ],
        answer: "A",
        explanation: "The Present Perfect Continuous connects an ongoing action initiated in the past to the present.",
      },
      {
        q: "According to Subject-Verb Agreement rules, which sentence is grammatically correct?",
        options: [
          "A) The committee has made its final decision",
          "B) The committee have make its final decision",
          "C) The committee were deciding yesterday without discussion",
          "D) The committee are unanimous in their disagreement",
        ],
        answer: "A",
        explanation: "Collective nouns acting as a single unit take a singular verb ('has made').",
      },
    ],
  },
  {
    id: "eng_grammar_general",
    matches: (t, s) =>
      t.includes("preposition") ||
      t.includes("conjunction") ||
      t.includes("metaphor") ||
      t.includes("simile") ||
      t.includes("figure of speech") ||
      s.includes("english"),
    questions: [
      {
        q: "What is the key difference between a Simile and a Metaphor?",
        options: [
          "A) A simile uses comparative words such as 'like' or 'as', whereas a metaphor makes a direct figurative identification without them",
          "B) A metaphor always uses animal comparisons",
          "C) A simile cannot appear in poetry",
          "D) There is no distinction between them",
        ],
        answer: "A",
        explanation: "A simile compares using 'like' or 'as' ('brave as a lion'); a metaphor states direct equivalence ('he is a lion in battle').",
      },
      {
        q: "Which grammatical element is used to join independent clauses with coordinating conjunctions (FANBOYS)?",
        options: [
          "A) For, And, Nor, But, Or, Yet, So",
          "B) In, On, Under, Over",
          "C) Quickly, Slowly, Beautifully",
          "D) Although, Because, Since",
        ],
        answer: "A",
        explanation: "Coordinating conjunctions connect equivalent grammatical units (remembered by the acronym FANBOYS).",
      },
    ],
  },

  // ==========================================
  // 10. COMPUTER SCIENCE & IT
  // ==========================================
  {
    id: "cs_arrays_linked_lists",
    matches: (t) =>
      t.includes("array") ||
      t.includes("linked") ||
      t.includes("list"),
    questions: [
      {
        q: "What is the primary memory allocation difference between an Array and a Linked List?",
        options: [
          "A) Arrays use contiguous memory blocks, whereas Linked Lists allocate individual nodes dynamically linked via pointers",
          "B) Linked Lists use static contiguous memory, whereas arrays use dynamic heap pointers",
          "C) Arrays can expand infinitely without resizing, while Linked Lists have a fixed capacity",
          "D) Linked Lists have O(1) random access by numerical index",
        ],
        answer: "A",
        explanation: "Arrays store elements in consecutive (contiguous) memory addresses, enabling instant index calculation. In contrast, Linked Lists store elements in non-contiguous memory locations where each node maintains a reference (pointer) to the next node.",
      },
      {
        q: "What is the time complexity to access an element by its index in an Array versus a Singly Linked List?",
        options: [
          "A) Array: O(1) constant time, Linked List: O(N) linear time",
          "B) Array: O(N) linear time, Linked List: O(1) constant time",
          "C) Array: O(log N) logarithmic time, Linked List: O(N) linear time",
          "D) Both provide O(1) random access",
        ],
        answer: "A",
        explanation: "Arrays support O(1) direct indexing arithmetic (base_address + index * element_size). Linked Lists must be traversed from the head node one pointer at a time, taking O(N) time in the worst case.",
      },
      {
        q: "In a Singly Linked List, what is the time complexity of inserting a new node at the head (beginning) if a head pointer is maintained?",
        options: [
          "A) O(N)",
          "B) O(1)",
          "C) O(log N)",
          "D) O(N^2)",
        ],
        answer: "B",
        explanation: "Inserting at the head simply requires pointing the new node's next pointer to the current head and updating the head pointer, which takes O(1) constant time.",
      },
      {
        q: "What is the primary disadvantage of a Doubly Linked List compared to a Singly Linked List?",
        options: [
          "A) Cannot be traversed backwards",
          "B) Extra memory overhead per node to store both next and previous pointers",
          "C) Deletion of a known node takes O(N) time instead of O(1)",
          "D) Does not allow dynamic insertion",
        ],
        answer: "B",
        explanation: "Every node in a Doubly Linked List must store an additional pointer (previous), increasing memory consumption per node.",
      },
    ],
  },
  {
    id: "cs_trees_graphs",
    matches: (t) =>
      t.includes("tree") ||
      t.includes("graph") ||
      t.includes("bst"),
    questions: [
      {
        q: "What is the primary structural difference between a Tree and a Graph data structure?",
        options: [
          "A) A Tree is a connected, acyclic graph with exactly N - 1 edges for N vertices, while a Graph can contain cycles and multiple disconnected components",
          "B) Trees are linear data structures, while graphs are non-linear",
          "C) Graphs cannot have weighted edges, whereas trees always require weights",
          "D) Trees can only store numerical values, whereas graphs store objects",
        ],
        answer: "A",
        explanation: "By mathematical and computational definition, a tree is a connected, acyclic graph. Any graph that contains cycles or disconnected vertices cannot be classified as a tree.",
      },
      {
        q: "Which traversal algorithm utilizes a Queue (FIFO) to explore nodes level-by-level in a Tree or Graph?",
        options: [
          "A) Depth-First Search (DFS)",
          "B) Breadth-First Search (BFS)",
          "C) In-Order Traversal",
          "D) Post-Order Traversal",
        ],
        answer: "B",
        explanation: "Breadth-First Search (BFS) utilizes a Queue data structure to traverse tree or graph vertices level-by-level starting from a source vertex.",
      },
      {
        q: "In a Binary Search Tree (BST), what is the worst-case time complexity for searching an element if the tree becomes completely skewed?",
        options: [
          "A) O(1)",
          "B) O(log N)",
          "C) O(N)",
          "D) O(N log N)",
        ],
        answer: "C",
        explanation: "When a Binary Search Tree becomes completely skewed (all nodes inserted in ascending or descending sorted order), it degenerates into a linear linked list with O(N) search time.",
      },
    ],
  },
  {
    id: "cs_stacks_queues",
    matches: (t) =>
      t.includes("stack") ||
      t.includes("queue"),
    questions: [
      {
        q: "Which fundamental data access principle governs a Stack data structure?",
        options: [
          "A) First-In, First-Out (FIFO)",
          "B) Last-In, First-Out (LIFO)",
          "C) Random Direct Access",
          "D) Lowest-Value First",
        ],
        answer: "B",
        explanation: "A Stack operates on the Last-In, First-Out (LIFO) principle: the most recently pushed element is the first one removed via pop().",
      },
      {
        q: "Which real-world computing mechanism relies directly on a Stack data structure?",
        options: [
          "A) Function call stack and recursion management",
          "B) Print queue spooling",
          "C) CPU round-robin scheduling",
          "D) Network packet routing",
        ],
        answer: "A",
        explanation: "The call stack manages active function calls, local variables, and return addresses using LIFO stack semantics.",
      },
      {
        q: "What principle governs a standard Queue data structure?",
        options: [
          "A) Last-In, First-Out (LIFO)",
          "B) First-In, First-Out (FIFO)",
          "C) Binary Priority Heap",
          "D) Hash Collisions",
        ],
        answer: "B",
        explanation: "A standard Queue enforces First-In, First-Out (FIFO) ordering: elements are enqueued at the rear and dequeued from the front.",
      },
    ],
  },
  {
    id: "cs_oop",
    matches: (t) =>
      t.includes("oop") ||
      t.includes("object") ||
      t.includes("class") ||
      t.includes("inherit") ||
      t.includes("polymorph") ||
      t.includes("encapsulat"),
    questions: [
      {
        q: "Which pillar of Object-Oriented Programming (OOP) refers to bundling data fields and methods together while hiding internal implementation details?",
        options: [
          "A) Encapsulation",
          "B) Inheritance",
          "C) Polymorphism",
          "D) Multithreading",
        ],
        answer: "A",
        explanation: "Encapsulation binds data and operating functions inside a class while restricting direct access through private and public access specifiers.",
      },
      {
        q: "What is Polymorphism in Object-Oriented Programming?",
        options: [
          "A) The ability of a message or function call to take on different forms depending on the underlying object type (method overriding/overloading)",
          "B) Creating duplicate copies of variables",
          "C) Restricting inheritance to a single subclass",
          "D) Allocating memory statically",
        ],
        answer: "A",
        explanation: "Polymorphism enables a single interface or base class reference to execute type-specific behaviors dynamically.",
      },
    ],
  },
  {
    id: "cs_database_sql",
    matches: (t) =>
      t.includes("sql") ||
      t.includes("database") ||
      t.includes("dbms") ||
      t.includes("table"),
    questions: [
      {
        q: "What is the primary role of a Primary Key constraint in a relational database table?",
        options: [
          "A) To uniquely identify each record in the table without allowing NULL values",
          "B) To link two databases over a network",
          "C) To encrypt text columns automatically",
          "D) To allow multiple identical records",
        ],
        answer: "A",
        explanation: "A Primary Key column enforces uniqueness and entity integrity, prohibiting duplicate or null values.",
      },
      {
        q: "Which SQL command clause is used to filter records based on specific criteria?",
        options: [
          "A) WHERE",
          "B) ORDER BY",
          "C) GROUP BY",
          "D) AS",
        ],
        answer: "A",
        explanation: "The WHERE clause filters rows returned by SELECT, UPDATE, or DELETE statements based on specified boolean conditions.",
      },
    ],
  },
  {
    id: "cs_security",
    matches: (t) =>
      t.includes("security") ||
      t.includes("cyber") ||
      t.includes("phish") ||
      t.includes("malware") ||
      t.includes("virus"),
    questions: [
      {
        q: "What is 'Phishing' in cybersecurity?",
        options: [
          "A) Deceptive fraudulent communications (emails, fake links) designed to trick users into revealing sensitive credentials or passwords",
          "B) Recovering deleted computer files",
          "C) Compressing network data packets",
          "D) Installing legitimate antivirus updates",
        ],
        answer: "A",
        explanation: "Phishing attacks use deceptive social engineering to impersonate legitimate entities and steal user credentials.",
      },
      {
        q: "Why is Two-Factor Authentication (2FA) recommended for securing online accounts?",
        options: [
          "A) It requires a second verification step (such as an OTP or authenticator prompt) even if the primary password is compromised",
          "B) It bypasses password requirements completely",
          "C) It prevents web cookies from being created",
          "D) It increases internet download speed",
        ],
        answer: "A",
        explanation: "2FA significantly bolsters security by combining something you know (password) with something you possess (device/authenticator code).",
      },
    ],
  },

  // ==========================================
  // 11. HINDI / LANGUAGES
  // ==========================================
  {
    id: "hindi_vyakaran",
    matches: (t, s) =>
      s.includes("hindi") ||
      t.includes("vyakaran") ||
      t.includes("sangya") ||
      t.includes("sarvanam") ||
      t.includes("sandhi") ||
      t.includes("samas"),
    questions: [
      {
        q: "हिन्दी व्याकरण में किसी व्यक्ति, वस्तु, स्थान या भाव के नाम का बोध कराने वाले शब्द को क्या कहते हैं?",
        options: [
          "A) संज्ञा (Noun)",
          "B) सर्वनाम (Pronoun)",
          "C) क्रिया (Verb)",
          "D) विशेषण (Adjective)",
        ],
        answer: "A",
        explanation: "किसी व्यक्ति, वस्तु, स्थान, गुण या भाव के नाम को संज्ञा कहा जाता है (जैसे- राम, दिल्ली, पुस्तक, मिठास)।",
      },
      {
        q: "संज्ञा के स्थान पर प्रयुक्त होने वाले शब्दों (जैसे- वह, तुम, मैं, हम) को क्या कहा जाता है?",
        options: [
          "A) सर्वनाम",
          "B) क्रियाविशेषण",
          "C) अव्यय",
          "D) उपसर्ग",
        ],
        answer: "A",
        explanation: "संज्ञा की पुनरुक्ति रोकने और वाक्य को सहज बनाने के लिए संज्ञा के स्थान पर सर्वनाम का प्रयोग किया जाता है।",
      },
      {
        q: "दो समीपवर्ती वर्णों के परस्पर मेल से जो विकार (परिवर्तन) उत्पन्न होता है, उसे क्या कहते हैं?",
        options: [
          "A) संधि (Sandhi)",
          "B) समास (Samas)",
          "C) प्रत्यय",
          "D) कारक",
        ],
        answer: "A",
        explanation: "दो ध्वनियों या वर्णों के परस्पर मिलने पर जो परिवर्तन होता है, उसे व्याकरण में संधि कहते हैं (जैसे: देव + आलय = देवालय)।",
      },
    ],
  },
];

/**
 * Intelligent Heuristic Topic-Specific Generator
 * Dynamically synthesizes 5 rigorous questions for any custom topic and subject,
 * ensuring zero cross-pollination from unrelated domains.
 */
function buildDynamicHeuristicQuiz(
  subject: string,
  topic: string,
  gradeLevel: string,
  questionCount: number
): string {
  const dynamicQuestions: DomainQuizQuestion[] = [
    {
      q: `Which statement best defines the core conceptual foundation and primary principle of ${topic} in ${subject}?`,
      options: [
        `A) The systematic study and practical application of theoretical rules, processes, and mechanisms governing ${topic}`,
        `B) An arbitrary collection of unsupported opinions lacking empirical foundation in ${subject}`,
        `C) A concept that has been entirely invalidated by modern ${subject}`,
        `D) A theoretical approach that ignores all standard definitions`,
      ],
      answer: "A",
      explanation: `In ${subject}, ${topic} is founded upon structured theoretical principles, standardized terminology, and systematic methodologies tailored for ${gradeLevel}.`,
    },
    {
      q: `When addressing problems or analyzing phenomena involving ${topic}, which systematic workflow is essential?`,
      options: [
        `A) Identifying parameters, applying verified principles of ${topic}, and cross-checking the outcome against boundary conditions`,
        `B) Estimating solutions intuitively without verifying constraints`,
        `C) Disregarding initial conditions and operational procedures`,
        `D) Skipping intermediate validation steps`,
      ],
      answer: "A",
      explanation: `Rigorous academic inquiry in ${topic} requires structured step-by-step problem-solving and systematic verification against known constraints.`,
    },
    {
      q: `What is a primary practical significance or real-world application of studying ${topic} in contemporary ${subject}?`,
      options: [
        `A) Enabling accurate quantitative or qualitative modeling, analytical prediction, and effective problem-solving in ${topic}`,
        `B) Completely replacing the need for critical thinking in ${subject}`,
        `C) Restricting knowledge strictly to abstract definitions with no real-world relevance`,
        `D) Disregarding established foundational laws`,
      ],
      answer: "A",
      explanation: `Understanding ${topic} provides critical tools to model, analyze, and solve relevant real-world challenges across ${subject}.`,
    },
    {
      q: `Which common pitfall should students avoid when evaluating principles related to ${topic}?`,
      options: [
        `A) Confusing superficial coincidences with fundamental governing principles and validated laws of ${topic}`,
        `B) Ensuring results are verified against baseline data`,
        `C) Applying systematic formulas and operational conventions`,
        `D) Maintaining structured notes and definitions`,
      ],
      answer: "A",
      explanation: `A key analytical skill in ${topic} is distinguishing true underlying mechanisms from misleading superficial observations.`,
    },
    {
      q: `In the curriculum progression for ${gradeLevel}, mastery of ${topic} directly enables students to:`,
      options: [
        `A) Synthesize foundational concepts of ${topic} to tackle advanced problem sets and interdisciplinary applications in ${subject}`,
        `B) Rely solely on rote memorization without contextual understanding`,
        `C) Avoid structured reasoning and critical evaluation`,
        `D) Disregard logical consistency in academic work`,
      ],
      answer: "A",
      explanation: `Mastery of ${topic} equips ${gradeLevel} students with the analytical reasoning and conceptual confidence required for advanced study in ${subject}.`,
    },
  ];

  return formatQuizResponse(subject, topic, gradeLevel, dynamicQuestions, questionCount);
}

/**
 * Master Quiz Matcher
 * Resolves the request against 49 curriculum banks, or falls back to the dynamic topic synthesizer.
 */
export function getDomainQuiz(
  subject: string,
  topic: string,
  gradeLevel: string = "Class 8",
  questionCount: number = 3
): string {
  const topicLower = topic.toLowerCase().trim();
  const subjectLower = subject.toLowerCase().trim();

  // Determine subject prefix
  let preferredPrefix = "";
  if (subjectLower.includes("math")) preferredPrefix = "math_";
  else if (subjectLower.includes("comp") || subjectLower.includes("cs") || subjectLower.includes("code") || subjectLower.includes("it")) preferredPrefix = "cs_";
  else if (subjectLower.includes("sci") || subjectLower.includes("phys") || subjectLower.includes("chem") || subjectLower.includes("bio")) preferredPrefix = "sci_";
  else if (subjectLower.includes("hist")) preferredPrefix = "hist_";
  else if (subjectLower.includes("geog")) preferredPrefix = "geog_";
  else if (subjectLower.includes("civic") || subjectLower.includes("polit") || subjectLower.includes("social")) preferredPrefix = "civics_";
  else if (subjectLower.includes("econ")) preferredPrefix = "econ_";
  else if (subjectLower.includes("eng") || subjectLower.includes("gram")) preferredPrefix = "eng_";
  else if (subjectLower.includes("hin")) preferredPrefix = "hindi_";

  // First pass: try banks that match the preferred subject prefix
  if (preferredPrefix) {
    for (const bank of DOMAIN_QUIZ_BANKS) {
      if (bank.id.startsWith(preferredPrefix) && bank.matches(topicLower, subjectLower)) {
        return formatQuizResponse(subject, topic, gradeLevel, bank.questions, questionCount);
      }
    }
  }

  // Second pass: try all other banks (excluding subject general fallbacks like math_general or sci_general unless subject matches)
  for (const bank of DOMAIN_QUIZ_BANKS) {
    if (bank.id === "math_general" && !subjectLower.includes("math")) continue;
    if (bank.id === "sci_general" && !subjectLower.includes("sci")) continue;
    if (bank.matches(topicLower, subjectLower)) {
      return formatQuizResponse(subject, topic, gradeLevel, bank.questions, questionCount);
    }
  }

  // Universal dynamic topic synthesizer for any custom topic
  return buildDynamicHeuristicQuiz(subject, topic, gradeLevel, questionCount);
}
