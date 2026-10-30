exports.build = (b) => {
  let x = 0;
  for (const [kind, act] of [["desktop", "Job orders"], ["tablet", "Job orders"], ["phone", "Job orders"]]) {
    const s = b.shell({ name: "Test " + kind, x, y: 0, kind, active: act });
    b.text(s.main, "Job orders", { style: "Heading/H1", color: "Text/heading" });
    x += { desktop: 1440, tablet: 834, phone: 390 }[kind] + 120;
  }
};
