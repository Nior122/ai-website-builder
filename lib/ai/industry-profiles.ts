// =============================================================================
// Industry Profiles — Deterministic design + content intelligence
// =============================================================================
// Every industry gets a hand-designed visual direction and content backbone:
// palette, fonts, radius/shadow, primary CTA, common services, target audience,
// business goals, recommended pages, per-page section blueprints, and example
// copy (stats, testimonials, FAQs).
//
// This is the guaranteed-quality fallback layer. When a free OpenRouter model
// returns broken JSON or generic copy, the pipeline falls back to these
// curated, business-specific profiles — so a restaurant never renders as a
// generic tech template. The LLM refines on top of these; it never has to
// invent a palette from nothing.
// =============================================================================

export interface IndustryProfile {
  id: string;
  labels: string[];
  /** Overall design direction: luxury | minimal | corporate | modern-saas | ... */
  direction: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  fonts: { heading: string; body: string; mono: string };
  /** Base border-radius token (rem). sm/md/lg/xl derive from it. */
  radius: string;
  /** Shadow intensity for this direction. */
  shadow: 'sm' | 'md' | 'lg';
  /** Neutral undertone — warm vs cool gray scale. */
  neutral: 'cool' | 'warm';
  primaryCta: string;
  services: string[];
  audience: string;
  painPoints: string[];
  goals: string[];
  /** Extra recommended page slugs beyond the base set. */
  pages: string[];
  /** Ordered section types for the home page. */
  homeSections: string[];
  stats: Array<{ value: string; label: string }>;
  testimonials: Array<{ name: string; role: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
}

// ─── Shared building blocks ────────────────────────────────────────────

const NEUTRAL_COOL = '#F8FAFC';
const NEUTRAL_WARM = '#FAFAF7';

interface ProfileSeed {
  id: string;
  labels: string[];
  direction: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  radius: string;
  shadow: 'sm' | 'md' | 'lg';
  neutral: 'cool' | 'warm';
  primaryCta: string;
  services: string[];
  audience: string;
  painPoints: string[];
  goals: string[];
  pages: string[];
  homeSections: string[];
  stats: Array<{ value: string; label: string }>;
  testimonials: Array<{ name: string; role: string; content: string }>;
  faqs: Array<{ question: string; answer: string }>;
}

// ─── Generic page blueprints (used when a profile doesn't override) ────

const BASE_HOME: string[] = ['hero', 'features', 'services', 'stats', 'testimonials', 'process', 'pricing', 'faq', 'cta', 'contact'];
const BASE_ABOUT: string[] = ['hero', 'about', 'mission', 'values', 'team', 'timeline', 'cta'];
const BASE_SERVICES: string[] = ['hero', 'services', 'process', 'pricing', 'faq', 'cta'];
const BASE_PRICING: string[] = ['hero', 'pricing', 'faq', 'cta'];
const BASE_PORTFOLIO: string[] = ['hero', 'portfolio', 'cta'];
const BASE_GALLERY: string[] = ['hero', 'gallery', 'cta'];
const BASE_TESTIMONIALS: string[] = ['hero', 'testimonials', 'cta'];
const BASE_BLOG: string[] = ['hero', 'blog', 'newsletter', 'cta'];
const BASE_FAQ: string[] = ['hero', 'faq', 'accordion', 'cta'];
const BASE_CONTACT: string[] = ['hero', 'contact', 'map', 'cta'];
const BASE_TEAM: string[] = ['hero', 'team', 'values', 'cta'];
const BASE_LANDING: string[] = ['hero', 'features', 'testimonials', 'pricing', 'faq', 'cta'];
const BASE_SALES: string[] = ['hero', 'features', 'testimonials', 'pricing', 'cta'];

/** Default blueprint for any page slug not otherwise listed. */
const GENERIC_PAGE: string[] = ['hero', 'features', 'cta'];

export const PAGE_BLUEPRINTS: Record<string, string[]> = {
  home: BASE_HOME,
  about: BASE_ABOUT,
  services: BASE_SERVICES,
  pricing: BASE_PRICING,
  portfolio: BASE_PORTFOLIO,
  gallery: BASE_GALLERY,
  testimonials: BASE_TESTIMONIALS,
  blog: BASE_BLOG,
  faq: BASE_FAQ,
  contact: BASE_CONTACT,
  team: BASE_TEAM,
  landing: BASE_LANDING,
  sales: BASE_SALES,
  privacy: ['privacy'],
  terms: ['terms'],
  '404': ['404'],
  'coming-soon': ['coming-soon'],
  checkout: ['checkout'],
  booking: ['booking'],
  menu: ['hero', 'services', 'gallery', 'cta'],
  products: ['hero', 'features', 'gallery', 'cta'],
  'case-studies': ['hero', 'portfolio', 'testimonials', 'cta'],
  programs: ['hero', 'services', 'testimonials', 'cta'],
  admissions: ['hero', 'process', 'faq', 'cta'],
  classes: ['hero', 'services', 'pricing', 'cta'],
  destinations: ['hero', 'gallery', 'testimonials', 'cta'],
  events: ['hero', 'blog', 'cta'],
  giving: ['hero', 'cta', 'contact'],
  listings: ['hero', 'portfolio', 'contact'],
  inventory: ['hero', 'portfolio', 'contact'],
  collection: ['hero', 'gallery', 'cta'],
  projects: ['hero', 'portfolio', 'process', 'cta'],
  features: ['hero', 'features', 'pricing', 'faq', 'cta'],
};

// ─── The profiles ──────────────────────────────────────────────────────

const PROFILES: ProfileSeed[] = [
  {
    id: 'general',
    labels: ['general', 'generic', 'business', 'small business', 'startup'],
    direction: 'modern-saas',
    primary: '#4F46E5', secondary: '#0EA5E9', accent: '#F59E0B',
    background: '#FFFFFF', surface: '#F8FAFC', text: '#0F172A', textSecondary: '#64748B', border: '#E2E8F0',
    headingFont: 'Inter', bodyFont: 'Inter', radius: '0.75rem', shadow: 'md', neutral: 'cool',
    primaryCta: 'Get Started',
    services: ['Consulting', 'Product Development', 'Customer Support'],
    audience: 'Small and growing businesses',
    painPoints: ['Limited time to manage operations', 'Unclear next steps for growth', 'Inconsistent service quality'],
    goals: ['Grow revenue sustainably', 'Build a recognizable brand', 'Delight customers at every step'],
    pages: ['services', 'pricing', 'contact'],
    homeSections: BASE_HOME,
    stats: [
      { value: '500+', label: 'Clients Served' },
      { value: '12', label: 'Years Experience' },
      { value: '98%', label: 'Satisfaction Rate' },
      { value: '24/7', label: 'Support' },
    ],
    testimonials: [
      { name: 'Jordan Miller', role: 'Operations Director', content: 'They transformed how we work — the team is responsive, professional, and genuinely cares about results.' },
      { name: 'Priya Sharma', role: 'Founder', content: 'From the first call to launch day, the experience was seamless. Highly recommended.' },
      { name: 'Marcus Lee', role: 'Marketing Lead', content: 'Clear communication and exceptional quality. Our numbers improved within the first quarter.' },
    ],
    faqs: [
      { question: 'How quickly can we get started?', answer: 'We typically begin within one week of your first consultation, with a clear timeline agreed up front.' },
      { question: 'Do you offer custom solutions?', answer: 'Yes — every engagement is tailored to your goals, budget, and timeline.' },
      { question: 'What does support look like after launch?', answer: 'You get a dedicated account team available around the clock, plus quarterly strategy reviews.' },
    ],
  },
  {
    id: 'restaurant',
    labels: ['restaurant', 'restaurants', 'cafe', 'café', 'caf', 'dining', 'bar', 'bakery', 'coffee', 'bistro', 'food', 'kitchen', 'catering'],
    direction: 'warm-hospitality',
    primary: '#E07A3F', secondary: '#7A4A2B', accent: '#F4A261',
    background: '#FFF8F0', surface: '#FFFFFF', text: '#2B1A10', textSecondary: '#7A5C48', border: '#EFE3D6',
    headingFont: 'Playfair Display', bodyFont: 'Lato', radius: '0.5rem', shadow: 'md', neutral: 'warm',
    primaryCta: 'Book a Table',
    services: ['Dine-In Service', 'Private Events', 'Catering', 'Takeout & Delivery'],
    audience: 'Food lovers and families in the local area',
    painPoints: ['Hard to find a table at peak hours', 'Uncertainty about menu options and dietary needs', 'Planning events and private dining'],
    goals: ['Fill reservations consistently', 'Showcase the seasonal menu', 'Build a loyal regular clientele'],
    pages: ['menu', 'gallery', 'contact'],
    homeSections: ['hero', 'services', 'gallery', 'testimonials', 'stats', 'contact', 'newsletter'],
    stats: [
      { value: '4.9★', label: 'Average Rating' },
      { value: '25+', label: 'Signature Dishes' },
      { value: '10k', label: 'Happy Guests a Year' },
      { value: '6', label: 'Days a Week Open' },
    ],
    testimonials: [
      { name: 'Sofia Reyes', role: 'Regular Guest', content: 'The tasting menu was unforgettable — every plate felt intentional and beautifully presented.' },
      { name: 'David Chen', role: 'Event Host', content: 'They hosted our anniversary dinner and the staff made it flawless from start to finish.' },
      { name: 'Amara Okafor', role: 'Food Blogger', content: 'Easily one of the best dining experiences in the city. The chef is a genius.' },
    ],
    faqs: [
      { question: 'Do you accommodate dietary restrictions?', answer: 'Absolutely — gluten-free, vegetarian, vegan, and allergy-friendly options are available on request.' },
      { question: 'Can we book the venue for private events?', answer: 'Yes, we host private dinners and celebrations for groups of 10 to 120 guests.' },
      { question: 'Is there parking available?', answer: 'We offer complimentary valet parking on weekends and street parking nearby on weekdays.' },
    ],
  },
  {
    id: 'law',
    labels: ['law', 'legal', 'lawyer', 'attorney', 'law firm', 'lawyers', 'legal services', 'law office', 'notary'],
    direction: 'trust-authoritative',
    primary: '#1E3A5F', secondary: '#0F2440', accent: '#C9A227',
    background: '#FFFFFF', surface: '#F7F9FC', text: '#1B2A41', textSecondary: '#5A6B85', border: '#E3E8F0',
    headingFont: 'Source Serif 4', bodyFont: 'Inter', radius: '0.25rem', shadow: 'sm', neutral: 'cool',
    primaryCta: 'Request a Consultation',
    services: ['Business Law', 'Real Estate Law', 'Family Law', 'Estate Planning', 'Litigation'],
    audience: 'Individuals and businesses seeking trusted legal counsel',
    painPoints: ['Confusing legal processes', 'Fear of expensive surprises', 'Need for clear, actionable advice'],
    goals: ['Win favorable outcomes for clients', 'Communicate complex law clearly', 'Build a reputation of integrity'],
    pages: ['services', 'team', 'contact'],
    homeSections: ['hero', 'services', 'stats', 'team', 'testimonials', 'faq', 'cta'],
    stats: [
      { value: '30+', label: 'Years of Practice' },
      { value: '2,500', label: 'Cases Resolved' },
      { value: '95%', label: 'Client Success Rate' },
      { value: '5', label: 'Practice Areas' },
    ],
    testimonials: [
      { name: 'Robert Grant', role: 'Small Business Owner', content: 'They explained every option in plain language and fought hard for a fair outcome.' },
      { name: 'Elena Vasquez', role: 'Homeowner', content: 'Our closing was handled flawlessly. I always felt informed and in control.' },
      { name: 'James Whitfield', role: 'Trustee', content: 'Precise, thorough, and genuinely ethical. I would not trust anyone else.' },
    ],
    faqs: [
      { question: 'What does an initial consultation involve?', answer: 'We review your situation, explain your legal options, and outline fees transparently — no obligation.' },
      { question: 'How are your fees structured?', answer: 'Matters are billed hourly or on a flat fee depending on the service, always agreed in writing up front.' },
      { question: 'Do you handle cases outside the state?', answer: 'Our attorneys are licensed across multiple jurisdictions and work with local counsel where needed.' },
    ],
  },
  {
    id: 'salon',
    labels: ['salon', 'salons', 'beauty', 'hair', 'spa', 'barber', 'beauty salon', 'hair salon', 'nails', 'lashes', 'aesthetics'],
    direction: 'elegant-soft',
    primary: '#DB2777', secondary: '#7C3AED', accent: '#F9A8D4',
    background: '#FDF2F8', surface: '#FFFFFF', text: '#3B0A2E', textSecondary: '#9D5C80', border: '#F9E2EF',
    headingFont: 'Cormorant Garamond', bodyFont: 'Montserrat', radius: '1rem', shadow: 'md', neutral: 'warm',
    primaryCta: 'Book an Appointment',
    services: ['Hair Styling', 'Color & Balayage', 'Nail Care', 'Skincare & Facials', 'Makeup Artistry'],
    audience: 'People who want to look and feel their best',
    painPoints: ['Hard to find time for self-care', 'Fear of a bad haircut or color', 'Uncertainty about pricing'],
    goals: ['Keep the appointment book full', 'Showcase before-and-after results', 'Create a pampering atmosphere'],
    pages: ['services', 'gallery', 'booking', 'team'],
    homeSections: ['hero', 'services', 'gallery', 'testimonials', 'stats', 'team', 'booking', 'contact'],
    stats: [
      { value: '15', label: 'Expert Stylists' },
      { value: '8k+', label: 'Happy Clients' },
      { value: '4.8★', label: 'Average Rating' },
      { value: '12', label: 'Years of Artistry' },
    ],
    testimonials: [
      { name: 'Hannah Brooks', role: 'Color Client', content: 'The balayage was exactly what I dreamed of. They listen, advise, and deliver every time.' },
      { name: 'Isabella Moreau', role: 'Wedding Client', content: 'My bridal look lasted all night and I felt stunning. The whole team was so warm.' },
      { name: 'Grace Adeyemi', role: 'Regular Client', content: 'Consistently brilliant results and the most relaxing atmosphere in town.' },
    ],
    faqs: [
      { question: 'How do I book an appointment?', answer: 'Book online in seconds or call the front desk — we offer evening and weekend availability.' },
      { question: 'Can I see my stylist’s work before booking?', answer: 'Of course — each stylist has a portfolio in our gallery and we are happy to recommend a match.' },
      { question: 'What is your cancellation policy?', answer: 'We kindly ask for 24 hours’ notice; appointments changed within that window are free of charge.' },
    ],
  },
  {
    id: 'saas',
    labels: ['saas', 'software', 'technology', 'tech', 'startup', 'app', 'platform', 'dev', 'developer', 'cloud', 'fintech', 'ai'],
    direction: 'modern-saas',
    primary: '#4F46E5', secondary: '#0EA5E9', accent: '#F59E0B',
    background: '#FFFFFF', surface: '#F8FAFC', text: '#0F172A', textSecondary: '#64748B', border: '#E2E8F0',
    headingFont: 'Inter', bodyFont: 'Inter', radius: '0.75rem', shadow: 'md', neutral: 'cool',
    primaryCta: 'Start Free Trial',
    services: ['Cloud Platform', 'Team Collaboration', 'Analytics & Insights', 'Integrations', 'Enterprise Security'],
    audience: 'Fast-moving teams and product leaders',
    painPoints: ['Scattered tools slow the team down', 'Poor visibility into performance', 'High setup and training costs'],
    goals: ['Activate more trial users', 'Reduce churn', 'Become the category leader'],
    pages: ['features', 'pricing', 'blog', 'contact'],
    homeSections: ['hero', 'features', 'stats', 'testimonials', 'pricing', 'faq', 'cta'],
    stats: [
      { value: '10k+', label: 'Active Teams' },
      { value: '99.99%', label: 'Uptime' },
      { value: '4.9/5', label: 'Customer Rating' },
      { value: '15min', label: 'Avg Setup Time' },
    ],
    testimonials: [
      { name: 'Alex Morgan', role: 'VP of Engineering', content: 'We replaced four tools overnight. The team adopted it without a single training session.' },
      { name: 'Casey Nguyen', role: 'Product Manager', content: 'The insights we get now would have taken days of manual work. It paid for itself in a month.' },
      { name: 'Sam Rivera', role: 'CEO', content: 'Reliable, fast, and genuinely loved by our engineers. This is how software should feel.' },
    ],
    faqs: [
      { question: 'Is there a free plan?', answer: 'Yes — every product starts with a generous free tier and a 14-day Pro trial with no credit card.' },
      { question: 'Can I migrate from a competitor?', answer: 'Our migration wizard imports your data and workflows automatically, with live support on hand.' },
      { question: 'Is my data secure?', answer: 'We are SOC 2 Type II certified, encrypt data at rest and in transit, and host in region-compliant data centers.' },
    ],
  },
  {
    id: 'ecommerce',
    labels: ['ecommerce', 'e-commerce', 'shop', 'store', 'retail', 'online store', 'boutique', 'commerce', 'ecom'],
    direction: 'commerce-bold',
    primary: '#F43F5E', secondary: '#111827', accent: '#F59E0B',
    background: '#FFFFFF', surface: '#F8FAFC', text: '#111827', textSecondary: '#6B7280', border: '#E5E7EB',
    headingFont: 'Poppins', bodyFont: 'Inter', radius: '0.75rem', shadow: 'lg', neutral: 'cool',
    primaryCta: 'Shop Now',
    services: ['Curated Product Range', 'Fast Delivery', 'Easy Returns', 'Membership Rewards'],
    audience: 'Trend-conscious shoppers looking for quality and value',
    painPoints: ['Uncertainty about product quality', 'Slow or expensive shipping', 'Complicated returns'],
    goals: ['Increase conversion rate', 'Grow repeat purchases', 'Build a recognizable brand'],
    pages: ['products', 'gallery', 'contact'],
    homeSections: ['hero', 'features', 'gallery', 'testimonials', 'stats', 'newsletter', 'cta'],
    stats: [
      { value: '50k+', label: 'Orders Delivered' },
      { value: '4.8★', label: 'Customer Rating' },
      { value: '24h', label: 'Dispatch Time' },
      { value: '60', label: 'Countries Served' },
    ],
    testimonials: [
      { name: 'Nina Kovač', role: 'Verified Buyer', content: 'Ordered on Monday, wearing it Wednesday. The quality exceeded the photos — rare!' },
      { name: 'Lucas Ferreira', role: 'Verified Buyer', content: 'Returns were painless and the support team replied in minutes. Will shop again.' },
      { name: 'Mei Tanaka', role: 'Loyal Customer', content: 'Their membership rewards genuinely pay off. I have recommended them to everyone.' },
    ],
    faqs: [
      { question: 'How fast is shipping?', answer: 'Orders dispatch within 24 hours; express delivery reaches most major cities in 2–3 business days.' },
      { question: 'What is your return policy?', answer: 'You have 30 days for free returns on any item, no questions asked.' },
      { question: 'Are the products authentic?', answer: 'We source directly from certified suppliers and every product comes with a quality guarantee.' },
    ],
  },
  {
    id: 'education',
    labels: ['education', 'school', 'college', 'university', 'academy', 'learning', 'training', 'tutoring', 'institute', 'course', 'kindergarten'],
    direction: 'friendly-trust',
    primary: '#2563EB', secondary: '#7C3AED', accent: '#F59E0B',
    background: '#FFFFFF', surface: '#F6F8FC', text: '#1E293B', textSecondary: '#64748B', border: '#E2E8F0',
    headingFont: 'Merriweather', bodyFont: 'Open Sans', radius: '0.5rem', shadow: 'sm', neutral: 'cool',
    primaryCta: 'Apply Now',
    services: ['Academic Programs', 'Extracurricular Activities', 'Career Counseling', 'Scholarships'],
    audience: 'Students and parents seeking quality education',
    painPoints: ['Choosing the right program', 'Worries about student success', 'Affordability and scholarships'],
    goals: ['Attract strong applicants', 'Showcase student outcomes', 'Build community trust'],
    pages: ['programs', 'admissions', 'contact'],
    homeSections: ['hero', 'services', 'stats', 'about', 'testimonials', 'blog', 'cta'],
    stats: [
      { value: '2,400', label: 'Students Enrolled' },
      { value: '97%', label: 'Graduation Rate' },
      { value: '1:18', label: 'Class Ratio' },
      { value: '35', label: 'Programs Offered' },
    ],
    testimonials: [
      { name: 'Mrs. Adebayo', role: 'Parent', content: 'The teachers know each child by name. My son has blossomed here.' },
      { name: 'Tomás Silva', role: 'Alumnus', content: 'This school prepared me for university and for life. I am proud to be an alumnus.' },
      { name: 'Dr. Rachel Kim', role: 'Faculty', content: 'A supportive environment where educators and students thrive together.' },
    ],
    faqs: [
      { question: 'How do I apply?', answer: 'Applications are online and open year-round. Our admissions team responds within five business days.' },
      { question: 'Are scholarships available?', answer: 'Yes — merit and need-based scholarships cover up to 80% of tuition.' },
      { question: 'What support services exist?', answer: 'We offer tutoring, counseling, career guidance, and a robust parent communication portal.' },
    ],
  },
  {
    id: 'medical',
    labels: ['medical', 'hospital', 'clinic', 'doctor', 'health', 'healthcare', 'care', 'dentist', 'dental', 'pharmacy', 'therapy', 'wellness', 'physical therapy', 'chiropractic'],
    direction: 'clinical-calm',
    primary: '#0E7490', secondary: '#155E75', accent: '#F97316',
    background: '#F0FDFA', surface: '#FFFFFF', text: '#134E4A', textSecondary: '#5B7A78', border: '#CCFBF1',
    headingFont: 'Lato', bodyFont: 'Source Sans 3', radius: '0.5rem', shadow: 'sm', neutral: 'cool',
    primaryCta: 'Book an Appointment',
    services: ['Primary Care', 'Specialist Consultations', 'Diagnostics & Imaging', 'Preventive Health'],
    audience: 'Patients and families seeking trusted, compassionate care',
    painPoints: ['Long wait times', 'Confusing appointment scheduling', 'Anxiety about procedures'],
    goals: ['Provide excellent patient outcomes', 'Reduce wait times', 'Build a caring reputation'],
    pages: ['services', 'team', 'contact'],
    homeSections: ['hero', 'services', 'stats', 'team', 'testimonials', 'faq', 'cta'],
    stats: [
      { value: '50k+', label: 'Patients Treated' },
      { value: '15', label: 'Specialist Doctors' },
      { value: '24/7', label: 'Emergency Care' },
      { value: '4.9★', label: 'Patient Rating' },
    ],
    testimonials: [
      { name: 'Margaret Osei', role: 'Patient', content: 'I was seen on time, treated with dignity, and left feeling genuinely cared for.' },
      { name: 'Daniel Hoffman', role: 'Patient', content: 'The specialist explained everything clearly and followed up personally. Exceptional.' },
      { name: 'Lucia Rossi', role: 'Patient', content: 'From the front desk to the doctor, everyone was kind and professional.' },
    ],
    faqs: [
      { question: 'Do I need a referral to book?', answer: 'For most services, no — book directly online or by phone, and we will guide you if a referral is needed.' },
      { question: 'What insurance do you accept?', answer: 'We work with most major insurers and offer transparent self-pay pricing.' },
      { question: 'Are walk-ins welcome?', answer: 'Walk-ins are welcome at our urgent care; specialist appointments are best booked in advance.' },
    ],
  },
  {
    id: 'construction',
    labels: ['construction', 'contractor', 'builder', 'builders', 'remodeling', 'renovation', 'home improvement', 'roofing', 'landscaping', 'electrician', 'plumbing', 'hvac'],
    direction: 'industrial-solid',
    primary: '#B45309', secondary: '#1F2937', accent: '#F59E0B',
    background: '#FFFBEB', surface: '#FFFFFF', text: '#1F2937', textSecondary: '#6B7280', border: '#F3E8CF',
    headingFont: 'Archivo', bodyFont: 'Inter', radius: '0.25rem', shadow: 'md', neutral: 'warm',
    primaryCta: 'Get a Free Quote',
    services: ['Residential Building', 'Commercial Construction', 'Renovations & Remodeling', 'Project Management'],
    audience: 'Homeowners and developers with building projects',
    painPoints: ['Budget overruns and surprises', 'Finding a reliable contractor', 'Delays and poor communication'],
    goals: ['Deliver projects on time and on budget', 'Win repeat and referral business', 'Showcase quality craftsmanship'],
    pages: ['projects', 'services', 'contact'],
    homeSections: ['hero', 'services', 'stats', 'portfolio', 'testimonials', 'process', 'cta'],
    stats: [
      { value: '250+', label: 'Projects Completed' },
      { value: '30', label: 'Years in Business' },
      { value: '100%', label: 'On-Time Delivery' },
      { value: '5.0★', label: 'Client Rating' },
    ],
    testimonials: [
      { name: 'Frank Delgado', role: 'Homeowner', content: 'They finished two weeks early and the craftsmanship is stunning. Worth every penny.' },
      { name: 'Sandra Whitmore', role: 'Property Developer', content: 'Transparent quoting, zero surprises, and a team that clearly takes pride in its work.' },
      { name: 'Ken Brooks', role: 'Commercial Client', content: 'Our office build was delivered on schedule with flawless quality. Highly recommended.' },
    ],
    faqs: [
      { question: 'Do you provide free quotes?', answer: 'Yes — every project starts with a detailed, fixed-price quote and a clear timeline.' },
      { question: 'Are you licensed and insured?', answer: 'Fully licensed, bonded, and insured across all states we operate in.' },
      { question: 'How do you keep projects on schedule?', answer: 'We share a project plan, weekly progress updates, and a dedicated site manager for every job.' },
    ],
  },
  {
    id: 'consulting',
    labels: ['consulting', 'consultant', 'consultancy', 'advisory', 'agency', 'marketing', 'strategy', 'coaching', 'business consulting'],
    direction: 'modern-saas',
    primary: '#0F766E', secondary: '#111827', accent: '#F59E0B',
    background: '#FFFFFF', surface: '#F0FDFA', text: '#134E4A', textSecondary: '#5B7A78', border: '#CCFBF1',
    headingFont: 'Space Grotesk', bodyFont: 'Inter', radius: '0.5rem', shadow: 'md', neutral: 'cool',
    primaryCta: 'Book a Strategy Call',
    services: ['Growth Strategy', 'Digital Marketing', 'Operations Optimization', 'Data & Analytics'],
    audience: 'Leaders who want measurable business growth',
    painPoints: ['Unclear growth levers', 'Marketing spend without returns', 'Fragmented operations'],
    goals: ['Deliver measurable ROI', 'Build long-term client partnerships', 'Become a trusted advisor'],
    pages: ['services', 'case-studies', 'blog', 'contact'],
    homeSections: ['hero', 'services', 'stats', 'portfolio', 'testimonials', 'process', 'cta'],
    stats: [
      { value: '300+', label: 'Engagements Delivered' },
      { value: '3.2x', label: 'Average ROI' },
      { value: '95%', label: 'Client Retention' },
      { value: '40+', label: 'Industries Served' },
    ],
    testimonials: [
      { name: 'Chloe Bennett', role: 'CMO', content: 'They turned our marketing around in a quarter. The growth was not luck — it was process.' },
      { name: 'Ravi Patel', role: 'COO', content: 'Operationally sharper than any firm we have used. Data-driven and relentlessly practical.' },
      { name: 'Emma Larsen', role: 'Founder', content: 'A true partner. They challenged our thinking and the results speak for themselves.' },
    ],
    faqs: [
      { question: 'How is the engagement structured?', answer: 'We begin with a diagnostic sprint, then agree on quarterly outcomes with clear KPIs and reporting.' },
      { question: 'What makes you different?', answer: 'We work embedded with your team, transfer skills, and tie every recommendation to a measurable outcome.' },
      { question: 'Do you work with small businesses?', answer: 'Yes — engagements are scaled to your size, with flexible monthly retainers.' },
    ],
  },
  {
    id: 'fitness',
    labels: ['fitness', 'gym', 'workout', 'personal training', 'crossfit', 'pilates', 'yoga', 'bootcamp', 'sports', 'training'],
    direction: 'energetic-bold',
    primary: '#DC2626', secondary: '#111827', accent: '#22C55E',
    background: '#FFFFFF', surface: '#F8FAFC', text: '#111827', textSecondary: '#6B7280', border: '#E5E7EB',
    headingFont: 'Archivo Black', bodyFont: 'Inter', radius: '0.5rem', shadow: 'lg', neutral: 'cool',
    primaryCta: 'Start a Free Class',
    services: ['Personal Training', 'Group Classes', 'Nutrition Coaching', 'Online Programs'],
    audience: 'People committed to transforming their health',
    painPoints: ['Lack of motivation and consistency', 'Not sure how to train safely', 'Plateaus and boredom'],
    goals: ['Grow memberships', 'Showcase real transformations', 'Build a motivating community'],
    pages: ['classes', 'pricing', 'team', 'contact'],
    homeSections: ['hero', 'services', 'stats', 'testimonials', 'pricing', 'team', 'cta'],
    stats: [
      { value: '2k+', label: 'Active Members' },
      { value: '87%', label: 'Goal Success Rate' },
      { value: '40+', label: 'Classes a Week' },
      { value: '12', label: 'Expert Coaches' },
    ],
    testimonials: [
      { name: 'Tyrone Jackson', role: 'Member', content: 'Down 30 pounds in five months and stronger than ever. The coaches keep me accountable.' },
      { name: 'Aisha Bello', role: 'Member', content: 'I finally found a gym that feels like family. Every workout is fresh and fun.' },
      { name: 'Connor Walsh', role: 'Member', content: 'The programming is world-class. My strength numbers have never moved this fast.' },
    ],
    faqs: [
      { question: 'Do you offer a free trial?', answer: 'Yes — your first class is free, and we will build a plan around your goals and fitness level.' },
      { question: 'What if I am a beginner?', answer: 'Perfect. Every program scales to your level and our coaches teach form from day one.' },
      { question: 'Can I pause my membership?', answer: 'Memberships can be paused up to three months a year, no questions asked.' },
    ],
  },
  {
    id: 'travel',
    labels: ['travel', 'tourism', 'hotel', 'resort', 'tour', 'vacation', 'tours', 'destination', 'airline', 'cruise', 'hostel'],
    direction: 'wanderlust-fresh',
    primary: '#0EA5E9', secondary: '#16A34A', accent: '#F59E0B',
    background: '#F0F9FF', surface: '#FFFFFF', text: '#0C4A6E', textSecondary: '#5A7D96', border: '#BAE6FD',
    headingFont: 'Nunito', bodyFont: 'Lato', radius: '1rem', shadow: 'md', neutral: 'cool',
    primaryCta: 'Plan My Trip',
    services: ['Custom Itineraries', 'Guided Tours', 'Luxury Stays', 'Adventure Packages'],
    audience: 'Explorers seeking unforgettable, stress-free trips',
    painPoints: ['Overwhelming trip planning', 'Hidden fees and surprises', 'Wanting authentic local experiences'],
    goals: ['Book more trips', 'Delight travelers end to end', 'Build a loyal travel community'],
    pages: ['destinations', 'gallery', 'blog', 'contact'],
    homeSections: ['hero', 'features', 'gallery', 'testimonials', 'stats', 'newsletter', 'cta'],
    stats: [
      { value: '15k', label: 'Travelers Delighted' },
      { value: '40+', label: 'Destinations' },
      { value: '4.9★', label: 'Trip Rating' },
      { value: '24/7', label: 'Travel Support' },
    ],
    testimonials: [
      { name: 'Liam O’Connor', role: 'Traveler', content: 'They planned a flawless two-week itinerary. Every detail was handled, every moment magic.' },
      { name: 'Yuki Sato', role: 'Traveler', content: 'The local guides made all the difference. We saw things no tourist book mentions.' },
      { name: 'Fatima Al-Sayed', role: 'Traveler', content: 'Zero stress from booking to return. I have never traveled this smoothly.' },
    ],
    faqs: [
      { question: 'Can you plan a custom itinerary?', answer: 'Every trip is custom. Tell us your style and budget, and we craft a one-of-a-kind plan.' },
      { question: 'Are your prices all-inclusive?', answer: 'Yes — quoted prices cover flights, stays, transfers, and activities with no hidden fees.' },
      { question: 'What if my plans change?', answer: 'Plans are flexible, and our 24/7 support rebooks at no charge up to 48 hours before departure.' },
    ],
  },
  {
    id: 'finance',
    labels: ['finance', 'financial', 'accounting', 'accountant', 'bank', 'banking', 'investment', 'insurance', 'tax', 'wealth', 'bookkeeping', 'mortgage'],
    direction: 'trust-authoritative',
    primary: '#0F766E', secondary: '#065F46', accent: '#F59E0B',
    background: '#F0FDF4', surface: '#FFFFFF', text: '#064E3B', textSecondary: '#5B7A68', border: '#D1FAE5',
    headingFont: 'Source Serif 4', bodyFont: 'Inter', radius: '0.25rem', shadow: 'sm', neutral: 'cool',
    primaryCta: 'Book a Free Review',
    services: ['Tax Preparation', 'Accounting & Bookkeeping', 'Financial Planning', 'Wealth Management', 'Insurance'],
    audience: 'Individuals and businesses who want financial clarity',
    painPoints: ['Tax season stress', 'Lack of financial visibility', 'Fear of costly mistakes'],
    goals: ['Save clients money', 'Simplify complex finances', 'Earn trust through transparency'],
    pages: ['services', 'pricing', 'team', 'contact'],
    homeSections: ['hero', 'services', 'stats', 'team', 'testimonials', 'faq', 'cta'],
    stats: [
      { value: '$2M+', label: 'Client Tax Savings' },
      { value: '800+', label: 'Clients Served' },
      { value: '30', label: 'Years Experience' },
      { value: '100%', label: 'On-Time Filings' },
    ],
    testimonials: [
      { name: 'George Hamilton', role: 'Business Owner', content: 'They found deductions we had missed for years. The savings paid for their service tenfold.' },
      { name: 'Ruth Kimani', role: 'Investor', content: 'Clear, proactive, and honest. My finances finally make sense.' },
      { name: 'Peter Novak', role: 'Client', content: 'Filing used to terrify me. Now it is handled in days with complete confidence.' },
    ],
    faqs: [
      { question: 'Do you handle small business taxes?', answer: 'Yes — we serve freelancers, LLCs, and corporations with year-round advisory, not just April.' },
      { question: 'How are your fees structured?', answer: 'Transparent flat fees agreed up front. You will never receive an unexpected invoice.' },
      { question: 'Can you work remotely?', answer: 'Fully — we work securely online with clients across the country and in multiple time zones.' },
    ],
  },
  {
    id: 'church',
    labels: ['church', 'ministry', 'worship', 'faith', 'congregation', 'temple', 'mosque', 'nonprofit', 'non-profit', 'charity', 'foundation', 'ngo'],
    direction: 'warm-inviting',
    primary: '#16A34A', secondary: '#0D9488', accent: '#F59E0B',
    background: '#F0FDF4', surface: '#FFFFFF', text: '#14532D', textSecondary: '#4B7A5E', border: '#D1FAE5',
    headingFont: 'Lora', bodyFont: 'Lato', radius: '0.5rem', shadow: 'sm', neutral: 'warm',
    primaryCta: 'Join Us This Sunday',
    services: ['Weekly Services', 'Youth & Family Programs', 'Community Outreach', 'Prayer & Counseling'],
    audience: 'Individuals and families seeking community and purpose',
    painPoints: ['Feeling disconnected', 'Not sure how to get involved', 'Wanting meaningful community'],
    goals: ['Grow the congregation', 'Serve the local community', 'Inspire generosity and giving'],
    pages: ['events', 'giving', 'contact'],
    homeSections: ['hero', 'about', 'services', 'stats', 'testimonials', 'blog', 'cta'],
    stats: [
      { value: '1,200', label: 'Congregation Members' },
      { value: '30+', label: 'Community Programs' },
      { value: '4', label: 'Weekly Services' },
      { value: '500', label: 'Volunteers' },
    ],
    testimonials: [
      { name: 'Grace Thompson', role: 'Member', content: 'This community welcomed my family with open arms. It feels like home.' },
      { name: 'Nathan Cole', role: 'Volunteer', content: 'Serving here has changed my life. The love is real and it is contagious.' },
      { name: 'Rebecca Hill', role: 'New Member', content: 'I walked in a stranger and left with family. There is no place I would rather be.' },
    ],
    faqs: [
      { question: 'What time are services?', answer: 'We hold services Saturday evening and Sunday mornings, with live streams for those away.' },
      { question: 'How do I get involved?', answer: 'Start with a welcome team at any service — we would love to help you find your place.' },
      { question: 'How can I support the ministry?', answer: 'You can give online, in service, or through volunteer opportunities — every gift matters.' },
    ],
  },
  {
    id: 'creative',
    labels: ['creative', 'agency', 'design', 'studio', 'photography', 'photographer', 'videography', 'production', 'advertising', 'branding', 'creative studio', 'marketing agency'],
    direction: 'creative-bold',
    primary: '#7C3AED', secondary: '#EC4899', accent: '#F59E0B',
    background: '#FAFAFF', surface: '#FFFFFF', text: '#1E1B4B', textSecondary: '#6D6B8F', border: '#E4E1F5',
    headingFont: 'Space Grotesk', bodyFont: 'Inter', radius: '1rem', shadow: 'lg', neutral: 'cool',
    primaryCta: 'Start a Project',
    services: ['Brand Identity', 'Web Design', 'Content Production', 'Campaign Strategy'],
    audience: 'Ambitious brands that want to stand out',
    painPoints: ['Generic-looking branding', 'Disconnected marketing', 'Hard-to-measure creative work'],
    goals: ['Build unforgettable brands', 'Drive measurable engagement', 'Win design awards'],
    pages: ['portfolio', 'services', 'contact'],
    homeSections: ['hero', 'services', 'portfolio', 'testimonials', 'stats', 'process', 'cta'],
    stats: [
      { value: '500+', label: 'Projects Delivered' },
      { value: '60', label: 'Brand Launches' },
      { value: '4.9★', label: 'Client Rating' },
      { value: '20', label: 'Design Awards' },
    ],
    testimonials: [
      { name: 'Oliver Grant', role: 'Startup Founder', content: 'They gave us a brand our whole team is proud of. Investors keep complimenting it.' },
      { name: 'Mia Fischer', role: 'Marketing Director', content: 'Bold, strategic, and stunningly executed. They raised our entire campaign.' },
      { name: 'Ava Robinson', role: 'Product Lead', content: 'The design system they built still powers our product two years later.' },
    ],
    faqs: [
      { question: 'How do you start a project?', answer: 'A discovery call, a detailed brief, and a fixed proposal with milestones and transparent pricing.' },
      { question: 'How long does a brand project take?', answer: 'Most brand identities take 4–6 weeks from kickoff to full handoff.' },
      { question: 'Do you work with early-stage startups?', answer: 'We love them — we offer startup-friendly packages without sacrificing craft.' },
    ],
  },
  {
    id: 'real-estate',
    labels: ['real estate', 'realestate', 'property', 'realtor', 'realty', 'housing', 'apartment', 'rentals', 'estate agent', 'developers'],
    direction: 'premium-clean',
    primary: '#0F766E', secondary: '#7C2D12', accent: '#D97706',
    background: '#F0FDFA', surface: '#FFFFFF', text: '#134E4A', textSecondary: '#5B7A78', border: '#CCFBF1',
    headingFont: 'DM Serif Display', bodyFont: 'Inter', radius: '0.5rem', shadow: 'md', neutral: 'cool',
    primaryCta: 'View Listings',
    services: ['Buying & Selling', 'Property Management', 'Valuation Services', 'First-Time Buyer Advice'],
    audience: 'Homebuyers, sellers, and investors',
    painPoints: ['Finding the right property', 'Navigating a competitive market', 'Hidden costs and paperwork'],
    goals: ['Close more sales', 'Match clients with dream homes', 'Build a trusted local name'],
    pages: ['listings', 'gallery', 'contact'],
    homeSections: ['hero', 'features', 'portfolio', 'stats', 'testimonials', 'gallery', 'cta'],
    stats: [
      { value: '1,000+', label: 'Homes Sold' },
      { value: '98%', label: 'List-to-Sale Ratio' },
      { value: '14', label: 'Days Avg on Market' },
      { value: '4.9★', label: 'Client Rating' },
    ],
    testimonials: [
      { name: 'Karen Mills', role: 'Seller', content: 'Our home sold in 11 days above asking. Their staging and marketing were superb.' },
      { name: 'Omar Hassan', role: 'Buyer', content: 'They found us our dream home in a brutal market and negotiated hard for us.' },
      { name: 'Linda Zhao', role: 'Investor', content: 'Professional, responsive, and honest. They manage our portfolio flawlessly.' },
    ],
    faqs: [
      { question: 'How much is my home worth?', answer: 'Request a free valuation — we provide a detailed market analysis within 48 hours.' },
      { question: 'Are you buyer’s agents too?', answer: 'Yes, and buyer representation is free to you in most areas — we are paid by the seller.' },
      { question: 'Do you manage rental properties?', answer: 'We manage residential and commercial properties, handling tenants, maintenance, and reporting.' },
    ],
  },
  {
    id: 'beauty',
    labels: ['beauty', 'cosmetics', 'skincare', 'makeup', 'brand', 'cosmetic', 'wellness spa'],
    direction: 'elegant-soft',
    primary: '#DB2777', secondary: '#7C3AED', accent: '#F9A8D4',
    background: '#FDF2F8', surface: '#FFFFFF', text: '#3B0A2E', textSecondary: '#9D5C80', border: '#F9E2EF',
    headingFont: 'Cormorant Garamond', bodyFont: 'Montserrat', radius: '1rem', shadow: 'md', neutral: 'warm',
    primaryCta: 'Shop the Collection',
    services: ['Skincare Rituals', 'Color Cosmetics', 'Clean Beauty Essentials', 'Beauty Consultations'],
    audience: 'Beauty lovers seeking clean, effective products',
    painPoints: ['Sensitive skin reactions', 'Overwhelming product choices', 'Questionable ingredient claims'],
    goals: ['Launch a cult-favorite line', 'Educate customers', 'Build an engaged community'],
    pages: ['products', 'gallery', 'blog', 'contact'],
    homeSections: ['hero', 'features', 'gallery', 'testimonials', 'stats', 'newsletter', 'cta'],
    stats: [
      { value: '100k', label: 'Products Sold' },
      { value: '99%', label: 'Clean Ingredients' },
      { value: '4.8★', label: 'Customer Rating' },
      { value: '30+', label: 'Countries Shipped' },
    ],
    testimonials: [
      { name: 'Bella Morgan', role: 'Customer', content: 'My skin has never looked better. Clean, effective, and honestly beautiful.' },
      { name: 'Chiara Romano', role: 'Beauty Editor', content: 'A rare brand where science meets luxury. The formulas are outstanding.' },
      { name: 'Sarah Chen', role: 'Customer', content: 'Finally, products that deliver on their promises. I am completely converted.' },
    ],
    faqs: [
      { question: 'Are your products truly clean?', answer: 'Every formula is dermatologist-tested, cruelty-free, and free from parabens, sulfates, and synthetic fragrances.' },
      { question: 'How do I find the right routine?', answer: 'Take our 2-minute skin quiz or book a free virtual consultation with a beauty expert.' },
      { question: 'What is your return policy?', answer: 'Love it or your money back within 30 days — even on used products.' },
    ],
  },
  {
    id: 'automotive',
    labels: ['automotive', 'car', 'auto', 'cars', 'dealership', 'mechanic', 'repair', 'motors', 'detailing', 'vehicle', 'garage'],
    direction: 'industrial-solid',
    primary: '#0F172A', secondary: '#334155', accent: '#E11D48',
    background: '#F8FAFC', surface: '#FFFFFF', text: '#0F172A', textSecondary: '#64748B', border: '#E2E8F0',
    headingFont: 'Archivo', bodyFont: 'Inter', radius: '0.25rem', shadow: 'md', neutral: 'cool',
    primaryCta: 'Book a Service',
    services: ['Vehicle Sales', 'Scheduled Maintenance', 'Diagnostics & Repairs', 'Detailing & Care'],
    audience: 'Drivers who want reliability and honest service',
    painPoints: ['Unexpected repair costs', 'Finding a trustworthy mechanic', 'Fear of being overcharged'],
    goals: ['Sell more vehicles', 'Retain loyal service customers', 'Build a transparent reputation'],
    pages: ['inventory', 'services', 'contact'],
    homeSections: ['hero', 'services', 'gallery', 'stats', 'testimonials', 'faq', 'cta'],
    stats: [
      { value: '5,000', label: 'Cars Serviced' },
      { value: '25', label: 'Years Experience' },
      { value: '4.8★', label: 'Customer Rating' },
      { value: '72h', label: 'Avg Turnaround' },
    ],
    testimonials: [
      { name: 'Mike Thompson', role: 'Service Customer', content: 'Honest prices and fast work. They explained everything and never pushed extras.' },
      { name: 'Jenny Alvarez', role: 'Buyer', content: 'Bought my first car here — no pressure, no games, great value.' },
      { name: 'Derek Mills', role: 'Fleet Owner', content: 'They keep our whole fleet running. Reliable, communicative, and fair.' },
    ],
    faqs: [
      { question: 'Do you offer warranty on repairs?', answer: 'All repairs carry a 12-month / 12,000-mile warranty on parts and labor.' },
      { question: 'Can I book service online?', answer: 'Yes — pick a time, describe the issue, and get a transparent estimate before work begins.' },
      { question: 'Do you finance vehicle purchases?', answer: 'We offer flexible financing with approval in minutes and trade-in valuation on the spot.' },
    ],
  },
  {
    id: 'fashion',
    labels: ['fashion', 'clothing', 'apparel', 'style', 'designer', 'garment', 'fashion house', 'accessories', 'jewelry'],
    direction: 'premium-clean',
    primary: '#0F172A', secondary: '#B45309', accent: '#D4A24E',
    background: '#FAFAF7', surface: '#FFFFFF', text: '#111111', textSecondary: '#6B6B6B', border: '#E8E4DC',
    headingFont: 'Playfair Display', bodyFont: 'Montserrat', radius: '0.25rem', shadow: 'md', neutral: 'warm',
    primaryCta: 'Shop the Lookbook',
    services: ['Signature Collections', 'Custom Tailoring', 'Limited Editions', 'Style Consultations'],
    audience: 'Fashion-forward individuals who value craft',
    painPoints: ['Fast-fashion sameness', 'Poor quality fabrics', 'Finding the perfect fit'],
    goals: ['Launch seasonal collections', 'Elevate brand prestige', 'Cultivate a loyal following'],
    pages: ['collection', 'gallery', 'contact'],
    homeSections: ['hero', 'gallery', 'features', 'testimonials', 'newsletter', 'cta'],
    stats: [
      { value: '50', label: 'New Styles a Season' },
      { value: '18', label: 'Countries Shipped' },
      { value: '4.9★', label: 'Customer Rating' },
      { value: '10yr', label: 'Garment Warranty' },
    ],
    testimonials: [
      { name: 'Victoria Lane', role: 'Client', content: 'The tailoring is immaculate and the fabric speaks for itself. True craftsmanship.' },
      { name: 'Sophie Turner', role: 'Client', content: 'Every piece fits like it was made for me — because it was.' },
      { name: 'Amelie Dubois', role: 'Fashion Editor', content: 'A house that understands timeless elegance. The collection is breathtaking.' },
    ],
    faqs: [
      { question: 'Do you offer made-to-measure?', answer: 'Yes — our atelier tailors every signature piece to your measurements with two fitting sessions.' },
      { question: 'What sizes do you carry?', answer: 'Ready-to-wear spans XXS–3XL, and made-to-measure fits any body.' },
      { question: 'How do I care for my garments?', answer: 'Each piece ships with care instructions, and our concierge offers complimentary pressing.' },
    ],
  },
  {
    id: 'hospitality-hotel',
    labels: ['hotel', 'resort', 'lodge', 'inn', 'boutique hotel', 'villa', 'retreat'],
    direction: 'luxury-calm',
    primary: '#1A1A1A', secondary: '#B45309', accent: '#D4A24E',
    background: '#FAFAF7', surface: '#FFFFFF', text: '#1A1A1A', textSecondary: '#6B6B6B', border: '#E8E4DC',
    headingFont: 'Playfair Display', bodyFont: 'Lato', radius: '0.25rem', shadow: 'md', neutral: 'warm',
    primaryCta: 'Reserve a Stay',
    services: ['Signature Rooms', 'Fine Dining', 'Spa & Wellness', 'Events & Weddings'],
    audience: 'Travelers seeking a refined, restorative escape',
    painPoints: ['Impersonal big-chain stays', 'Complicated booking', 'Wanting memorable local experiences'],
    goals: ['Maximize occupancy', 'Win five-star reviews', 'Become a destination itself'],
    pages: ['rooms', 'gallery', 'contact'],
    homeSections: ['hero', 'services', 'gallery', 'testimonials', 'stats', 'contact', 'newsletter'],
    stats: [
      { value: '120', label: 'Luxury Rooms' },
      { value: '4.9★', label: 'Guest Rating' },
      { value: '85%', label: 'Return Guests' },
      { value: '5', label: 'Dining Venues' },
    ],
    testimonials: [
      { name: 'Charlotte Webb', role: 'Guest', content: 'From check-in to checkout, every detail was considered. A truly restful stay.' },
      { name: 'Henry Ford', role: 'Guest', content: 'The suite, the spa, the staff — flawless. We left already planning our return.' },
      { name: 'Isabelle Laurent', role: 'Guest', content: 'The most beautiful hotel I have stayed in. The breakfast alone is worth it.' },
    ],
    faqs: [
      { question: 'What are check-in times?', answer: 'Check-in is from 3 PM and checkout by 11 AM, with early access on request.' },
      { question: 'Are pets welcome?', answer: 'We welcome pets up to 25 kg in select rooms with a small cleaning fee.' },
      { question: 'Do you host weddings?', answer: 'Our events team plans intimate weddings for up to 150 guests with full catering.' },
    ],
  },
];

// ─── Public API ────────────────────────────────────────────────────────

const PROFILE_MAP: Record<string, IndustryProfile> = {};
for (const seed of PROFILES) {
  const profile: IndustryProfile = {
    id: seed.id,
    labels: seed.labels,
    direction: seed.direction,
    palette: {
      primary: seed.primary, secondary: seed.secondary, accent: seed.accent,
      background: seed.background, surface: seed.surface,
      text: seed.text, textSecondary: seed.textSecondary, border: seed.border,
    },
    fonts: { heading: seed.headingFont, body: seed.bodyFont, mono: 'JetBrains Mono' },
    radius: seed.radius,
    shadow: seed.shadow,
    neutral: seed.neutral,
    primaryCta: seed.primaryCta,
    services: seed.services,
    audience: seed.audience,
    painPoints: seed.painPoints,
    goals: seed.goals,
    pages: seed.pages,
    homeSections: seed.homeSections,
    stats: seed.stats,
    testimonials: seed.testimonials,
    faqs: seed.faqs,
  };
  PROFILE_MAP[seed.id] = profile;
  for (const label of seed.labels) PROFILE_MAP[label] = profile;
}

/**
 * Resolve a free-form industry string to the closest curated profile.
 * Falls back to the general profile when nothing matches.
 */
export function getIndustryProfile(industry?: string): IndustryProfile {
  if (!industry) return PROFILE_MAP['general'];
  const key = industry.trim().toLowerCase();
  if (PROFILE_MAP[key]) return PROFILE_MAP[key];
  // Partial word match (e.g. "restaurant & bar" → restaurant).
  for (const id of Object.keys(PROFILE_MAP)) {
    if (id.includes(' ')) continue; // aliases with spaces are checked below
    if (key.includes(id) || id.includes(key)) return PROFILE_MAP[id];
  }
  return PROFILE_MAP['general'];
}

/**
 * Ordered section blueprint for a page in a given industry.
 */
export function getPageBlueprint(profile: IndustryProfile, pageSlug: string): string[] {
  const slug = pageSlug.toLowerCase().trim();
  if (slug === 'home') return profile.homeSections;
  if (PAGE_BLUEPRINTS[slug]) return PAGE_BLUEPRINTS[slug];
  return GENERIC_PAGE;
}

/** All known section types the generator may emit (registry-driven). */
export const SUPPORTED_SECTION_TYPES: string[] = [
  'hero', 'features', 'services', 'pricing', 'testimonials', 'faq', 'gallery',
  'contact', 'cta', 'stats', 'team', 'timeline', 'about', 'mission', 'values',
  'process', 'portfolio', 'newsletter', 'video', 'map', 'accordion', 'tabs',
  'divider', 'spacer', 'html', 'blog', 'booking', 'checkout', 'coming-soon',
  'landing', 'sales', 'terms', 'privacy', '404',
];

/** All design directions used across profiles. */
export const DESIGN_DIRECTIONS: string[] = [
  'modern-saas', 'warm-hospitality', 'trust-authoritative', 'elegant-soft',
  'commerce-bold', 'friendly-trust', 'clinical-calm', 'industrial-solid',
  'energetic-bold', 'wanderlust-fresh', 'warm-inviting', 'creative-bold',
  'premium-clean', 'luxury-calm', 'minimal',
];

/** Human-readable label for a design direction. */
export function directionLabel(direction: string): string {
  const map: Record<string, string> = {
    'modern-saas': 'Modern SaaS',
    'warm-hospitality': 'Warm Hospitality',
    'trust-authoritative': 'Trust & Authority',
    'elegant-soft': 'Elegant & Soft',
    'commerce-bold': 'Commerce & Bold',
    'friendly-trust': 'Friendly & Trustworthy',
    'clinical-calm': 'Clinical & Calm',
    'industrial-solid': 'Industrial & Solid',
    'energetic-bold': 'Energetic & Bold',
    'wanderlust-fresh': 'Wanderlust & Fresh',
    'warm-inviting': 'Warm & Inviting',
    'creative-bold': 'Creative & Bold',
    'premium-clean': 'Premium & Clean',
    'luxury-calm': 'Luxury & Calm',
    minimal: 'Minimal',
  };
  return map[direction] || 'Modern & Professional';
}
