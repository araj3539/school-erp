export const motionVariants = {
  // Fade in with slight upward movement
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 20, stiffness: 100 },
    },
  },
  // Stagger children for list items
  staggerContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.05,
        staggerChildren: 0.08,
      },
    },
  },
  staggerItem: {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 18, stiffness: 120 },
    },
  },
  // Scale on hover
  scaleHover: {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  },
  // Card lift on hover
  cardHover: {
    rest: { y: 0, boxShadow: "0 10px 15px -3px rgb(15 23 42 / 0.08)" },
    hover: {
      y: -4,
      boxShadow: "0 25px 50px -12px rgb(15 23 42 / 0.15)",
      transition: { type: "spring", damping: 20, stiffness: 300 },
    },
  },
  // Slide from side
  slideFromLeft: {
    hidden: { x: -40, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", damping: 22, stiffness: 300 },
    },
  },
  // Pulse for attention
  pulse: {
    rest: { opacity: 1, scale: 1 },
    hover: {
      opacity: 1,
      scale: 1.05,
      transition: { repeat: Infinity, repeatType: "reverse", duration: 0.6 },
    },
  },
  // Modal entrance
  modal: {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", damping: 25, stiffness: 300 },
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  },
  // Drawer slide
  drawer: {
    hidden: { x: "100%", opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: "spring", damping: 25, stiffness: 400 },
    },
    exit: {
      x: "100%",
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
  // Staggered reveal
  reveal: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", damping: 15, stiffness: 200 },
    },
  },
  // Number counter
  counter: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  },
};

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};
