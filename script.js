const icons = {
  chart: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-7"/></svg>',
  boxes: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  settings: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.4.5.75.9 1 .32.2.7.3 1.1.3h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-2 1Z"/></svg>',
  calculator: '<svg aria-hidden="true" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>',
  shield: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></svg>',
  book: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z"/></svg>',
  compare: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 3v18M16 3v18"/><path d="M3 8h10M11 16h10"/></svg>',
  bookmark: '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M19 21 12 17 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>'
};

const pillars = [
  { title: 'Practical', body: 'Tools should solve real business, academic, and operational problems.', icon: 'calculator' },
  { title: 'Accessible', body: 'No specialist software or complicated setup should be required.', icon: 'settings' },
  { title: 'Transparent', body: 'Show formulas, assumptions, explanations, and calculation logic where appropriate.', icon: 'book' },
  { title: 'Decision-Focused', body: 'Results should provide useful interpretation, not only a number.', icon: 'chart' }
];

const problems = [
  {
    title: 'Which inventory items need the most control?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which products contribute the most to inventory value or revenue?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which products have the most stable demand patterns?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which products have highly variable or unpredictable demand?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which SKUs require the highest management attention?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which items should carry the highest safety stock priority?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which items can operate with lower inventory buffers?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which products are at the highest risk of stockouts?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which products are overstocked relative to their importance and demand pattern?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which SKUs should have the highest service level targets?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which products require more accurate forecasting and planning?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which items should be reviewed more frequently for replenishment?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which SKUs should be candidates for make-to-order rather than make-to-stock?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which products require stronger supplier management or dual sourcing?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which SKUs should be prioritized during inventory shortages?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which low-value, highly volatile items should be rationalized or discontinued?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'How should inventory policies differ across product categories?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Where should working capital be invested to maximize inventory performance?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'Which inventory segments represent the greatest business and planning risk?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'How should warehouse space and resources be allocated across SKUs?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'What is the recommended inventory strategy for each ABC-XYZ segment?',
    detail: 'Recommended tool: ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html'
  },
  {
    title: 'How much stock should I order for a stable-demand item?',
    detail: 'Recommended tool: Economic Order Quantity',
    href: 'Economic%20Order%20Quantity/Economic_Order_Quantity.html'
  },
  {
    title: 'What order quantity balances ordering cost and holding cost?',
    detail: 'Recommended tool: Economic Order Quantity',
    href: 'Economic%20Order%20Quantity/Economic_Order_Quantity.html'
  },
  {
    title: 'How often should I place replenishment orders for a stable item?',
    detail: 'Recommended tool: Economic Order Quantity',
    href: 'Economic%20Order%20Quantity/Economic_Order_Quantity.html'
  },
  {
    title: 'Is my current order quantity costing more than the EOQ?',
    detail: 'Recommended tool: Economic Order Quantity',
    href: 'Economic%20Order%20Quantity/Economic_Order_Quantity.html'
  },
  {
    title: 'How does changing ordering cost or holding cost affect order quantity?',
    detail: 'Recommended tool: Economic Order Quantity',
    href: 'Economic%20Order%20Quantity/Economic_Order_Quantity.html'
  },
  {
    title: 'How much buffer stock should I keep?',
    detail: 'Recommended tool: Safety Stock & Reorder Point',
    href: 'Safety%20Stock%20%26%20Reorder%20Point/Safety_Stock_Reorder_Point.html'
  },
  {
    title: 'When should I reorder inventory?',
    detail: 'Recommended tool: Safety Stock & Reorder Point',
    href: 'Safety%20Stock%20%26%20Reorder%20Point/Safety_Stock_Reorder_Point.html'
  },
  {
    title: 'What reorder point should I use when demand and lead time vary?',
    detail: 'Recommended tool: Safety Stock & Reorder Point',
    href: 'Safety%20Stock%20%26%20Reorder%20Point/Safety_Stock_Reorder_Point.html'
  },
  {
    title: 'How does service level change my safety stock requirement?',
    detail: 'Recommended tool: Safety Stock & Reorder Point',
    href: 'Safety%20Stock%20%26%20Reorder%20Point/Safety_Stock_Reorder_Point.html'
  },
  {
    title: 'Is my current inventory position below the reorder point?',
    detail: 'Recommended tool: Safety Stock & Reorder Point',
    href: 'Safety%20Stock%20%26%20Reorder%20Point/Safety_Stock_Reorder_Point.html'
  },
  {
    title: 'How many days of coverage do I have before I need to reorder?',
    detail: 'Recommended tool: Safety Stock & Reorder Point',
    href: 'Safety%20Stock%20%26%20Reorder%20Point/Safety_Stock_Reorder_Point.html'
  },
  {
    title: 'How can I forecast seasonal demand?',
    detail: 'Recommended tool: Exponential Smoothing',
    href: 'Exponential%20Smoothing/Exponential_Smoothing.html'
  },
  {
    title: 'How can I forecast demand when there is a trend?',
    detail: 'Recommended tool: Exponential Smoothing',
    href: 'Exponential%20Smoothing/Exponential_Smoothing.html'
  },
  {
    title: 'What is the next-period forecast from recent demand history?',
    detail: 'Recommended tool: Exponential Smoothing',
    href: 'Exponential%20Smoothing/Exponential_Smoothing.html'
  },
  {
    title: 'Which smoothing method fits my demand pattern best?',
    detail: 'Recommended tool: Exponential Smoothing',
    href: 'Exponential%20Smoothing/Exponential_Smoothing.html'
  },
  {
    title: 'How accurate is my forecast using MAE?',
    detail: 'Recommended tool: Exponential Smoothing',
    href: 'Exponential%20Smoothing/Exponential_Smoothing.html'
  },
  {
    title: 'Which purchasing categories need strategic supplier attention?',
    detail: 'Recommended tool: Kraljic Matrix',
    href: 'Kraljic%20Matrix/Kraljic_Matrix.html'
  },
  {
    title: 'Which spend categories are high impact and high supply risk?',
    detail: 'Recommended tool: Kraljic Matrix',
    href: 'Kraljic%20Matrix/Kraljic_Matrix.html'
  },
  {
    title: 'Which categories should use leverage, strategic, bottleneck, or routine sourcing strategies?',
    detail: 'Recommended tool: Kraljic Matrix',
    href: 'Kraljic%20Matrix/Kraljic_Matrix.html'
  },
  {
    title: 'Which suppliers or categories create the highest procurement risk?',
    detail: 'Recommended tool: Kraljic Matrix',
    href: 'Kraljic%20Matrix/Kraljic_Matrix.html'
  },
  {
    title: 'Where should procurement focus negotiation effort and supplier relationships?',
    detail: 'Recommended tool: Kraljic Matrix',
    href: 'Kraljic%20Matrix/Kraljic_Matrix.html'
  },
  {
    title: 'How can I plan project tasks over time?',
    detail: 'Recommended tool: Gantt Chart Planner',
    href: 'Gantt%20Chart/Gantt_Chart.html'
  },
  {
    title: 'How can I create a timeline for project tasks and milestones?',
    detail: 'Recommended tool: Gantt Chart Planner',
    href: 'Gantt%20Chart/Gantt_Chart.html'
  },
  {
    title: 'How can I see project progress across weeks and months?',
    detail: 'Recommended tool: Gantt Chart Planner',
    href: 'Gantt%20Chart/Gantt_Chart.html'
  },
  {
    title: 'How can I save and reload a project plan as JSON?',
    detail: 'Recommended tool: Gantt Chart Planner',
    href: 'Gantt%20Chart/Gantt_Chart.html'
  },
  {
    title: 'How many units do I need to sell to break even?',
    detail: 'Recommended tool: Break-Even Analysis',
    href: 'Break%20Even%20Analysis/Break_Even_Analysis.html'
  },
  {
    title: 'What sales volume is needed to reach a target profit?',
    detail: 'Recommended tool: Break-Even Analysis',
    href: 'Break%20Even%20Analysis/Break_Even_Analysis.html'
  },
  {
    title: 'How much margin of safety do I have at expected sales?',
    detail: 'Recommended tool: Break-Even Analysis',
    href: 'Break%20Even%20Analysis/Break_Even_Analysis.html'
  },
  {
    title: 'How do price, fixed cost, and variable cost affect profitability?',
    detail: 'Recommended tool: Break-Even Analysis',
    href: 'Break%20Even%20Analysis/Break_Even_Analysis.html'
  },
  {
    title: 'What revenue do I need to cover fixed and variable costs?',
    detail: 'Recommended tool: Break-Even Analysis',
    href: 'Break%20Even%20Analysis/Break_Even_Analysis.html'
  },
  {
    title: 'Which option should I choose when several criteria matter?',
    detail: 'Recommended tool: Analytic Hierarchy Process',
    href: 'Analytic%20Hierarchy%20Process/Analytic_Hierarchy_Process.html'
  },
  {
    title: 'Which supplier is the best fit across cost, quality, delivery, and risk?',
    detail: 'Recommended tool: Analytic Hierarchy Process',
    href: 'Analytic%20Hierarchy%20Process/Analytic_Hierarchy_Process.html'
  },
  {
    title: 'Which 3PL partner should I select for service coverage and logistics performance?',
    detail: 'Recommended tool: Analytic Hierarchy Process',
    href: 'Analytic%20Hierarchy%20Process/Analytic_Hierarchy_Process.html'
  },
  {
    title: 'Which warehouse location is strongest across cost, access, labour, and customer proximity?',
    detail: 'Recommended tool: Analytic Hierarchy Process',
    href: 'Analytic%20Hierarchy%20Process/Analytic_Hierarchy_Process.html'
  },
  {
    title: 'Which transport mode should I choose when cost, speed, reliability, and emissions matter?',
    detail: 'Recommended tool: Analytic Hierarchy Process',
    href: 'Analytic%20Hierarchy%20Process/Analytic_Hierarchy_Process.html'
  },
  {
    title: 'Which inventory policy is best when service level, working capital, and stockout risk conflict?',
    detail: 'Recommended tool: Analytic Hierarchy Process',
    href: 'Analytic%20Hierarchy%20Process/Analytic_Hierarchy_Process.html'
  },
  {
    title: 'What is the probability of achieving a target profit when demand and costs are uncertain?',
    detail: 'Recommended tool: Monte Carlo Risk Simulation',
    href: 'Monte%20Carlo%20Risk%20Simulation/Monte_Carlo_Risk_Simulation.html'
  },
  {
    title: 'What project budget gives me an 80% or 90% confidence level?',
    detail: 'Recommended tool: Monte Carlo Risk Simulation',
    href: 'Monte%20Carlo%20Risk%20Simulation/Monte_Carlo_Risk_Simulation.html'
  },
  {
    title: 'Which uncertain input has the strongest relationship with my result?',
    detail: 'Recommended tool: Monte Carlo Risk Simulation',
    href: 'Monte%20Carlo%20Risk%20Simulation/Monte_Carlo_Risk_Simulation.html'
  },
  {
    title: 'How likely is my project to finish before the deadline?',
    detail: 'Recommended tool: Monte Carlo Risk Simulation',
    href: 'Monte%20Carlo%20Risk%20Simulation/Monte_Carlo_Risk_Simulation.html'
  },
  {
    title: 'What is the risk of stockout when demand and replenishment are uncertain?',
    detail: 'Recommended tool: Monte Carlo Risk Simulation',
    href: 'Monte%20Carlo%20Risk%20Simulation/Monte_Carlo_Risk_Simulation.html'
  },
  {
    title: 'How can I model best case, likely case, and worst case expert estimates?',
    detail: 'Recommended tool: Monte Carlo Risk Simulation',
    href: 'Monte%20Carlo%20Risk%20Simulation/Monte_Carlo_Risk_Simulation.html'
  }
];

const categories = [
  { title: 'Inventory and Supply Chain', benefit: 'Optimize stock, service levels, purchasing, and supplier decisions.', count: '4 tools available', icon: 'boxes' },
  { title: 'Forecasting', benefit: 'Identify trends, seasonality, and future demand.', count: '1 tool available', icon: 'chart' },
  { title: 'Operations', benefit: 'Evaluate capacity, productivity, queues, and process performance.', count: 'Expanding soon', icon: 'settings' },
  { title: 'Statistics', benefit: 'Analyze distributions, uncertainty, samples, and probability-driven outcomes.', count: '1 tool available', icon: 'compare' },
  { title: 'Finance', benefit: 'Assess investments, costs, returns, and business viability.', count: '1 tool available', icon: 'calculator' },
  { title: 'Quality and Engineering', benefit: 'Measure process capability, reliability, variation, and performance.', count: 'Expanding soon', icon: 'shield' },
  { title: 'Project Management', benefit: 'Plan schedules, resources, risk, and project economics.', count: '1 tool available', icon: 'settings' },
  { title: 'Business Analysis', benefit: 'Compare scenarios and support strategic decisions.', count: '3 tools available', icon: 'chart' }
];

const tools = [
  {
    name: 'ABC Analysis',
    description: 'Classify inventory by annual consumption value, with optional XYZ demand variability segmentation.',
    category: 'Inventory Management',
    input: 'Annual value or monthly quantity plus unit cost',
    output: 'ABC classes, optional ABC-XYZ matrix, and Pareto chart',
    cta: 'Open ABC Analysis',
    href: 'ABC%20Analysis/ABC_Analysis.html',
    categories: ['Inventory and Supply Chain']
  },
  {
    name: 'Economic Order Quantity',
    description: 'Estimate the order quantity that balances ordering and holding costs.',
    category: 'Inventory Management',
    input: 'Demand, order cost, holding cost',
    output: 'EOQ, cost curve, and reorder point',
    cta: 'Open Economic Order Quantity',
    href: 'Economic%20Order%20Quantity/Economic_Order_Quantity.html',
    categories: ['Inventory and Supply Chain']
  },
  {
    name: 'Safety Stock & Reorder Point',
    description: 'Estimate buffer stock and replenishment trigger levels under demand and lead time uncertainty.',
    category: 'Inventory Management',
    input: 'Demand variability, lead time, service level',
    output: 'Safety stock, reorder point, and stock action',
    cta: 'Open Safety Stock & Reorder Point',
    href: 'Safety%20Stock%20%26%20Reorder%20Point/Safety_Stock_Reorder_Point.html',
    categories: ['Inventory and Supply Chain']
  },
  {
    name: 'Exponential Smoothing',
    description: 'Forecast demand using simple smoothing, Holt’s trend method, or Holt-Winters seasonality.',
    category: 'Forecasting',
    input: 'Historical demand series',
    output: 'Forecast table, error metric, and chart',
    cta: 'Open Exponential Smoothing',
    href: 'Exponential%20Smoothing/Exponential_Smoothing.html',
    categories: ['Forecasting']
  },
  {
    name: 'Kraljic Matrix',
    description: 'Segment suppliers and purchases by supply risk and profit impact.',
    category: 'Procurement',
    input: 'Risk and impact ratings',
    output: 'Portfolio quadrant and strategy',
    href: 'Kraljic%20Matrix/Kraljic_Matrix.html',
    categories: ['Inventory and Supply Chain']
  },
  {
    name: 'Break-Even Analysis',
    description: 'Find the volume or revenue needed to cover fixed and variable costs.',
    category: 'Finance',
    input: 'Price, fixed cost, variable cost',
    output: 'Break-even quantity and margin',
    cta: 'Open Break-Even Analysis',
    href: 'Break%20Even%20Analysis/Break_Even_Analysis.html',
    categories: ['Finance', 'Business Analysis']
  },
  {
    name: 'Analytic Hierarchy Process',
    description: 'Design pairwise questionnaires, collect expert judgements, and rank alternatives across multiple criteria.',
    category: 'Business Analysis',
    input: 'Criteria, alternatives, expert pairwise comparisons',
    output: 'Criteria weights, consistency ratios, and ranked alternatives',
    cta: 'Open Analytic Hierarchy Process',
    href: 'Analytic%20Hierarchy%20Process/Analytic_Hierarchy_Process.html',
    categories: ['Business Analysis']
  },
  {
    name: 'Gantt Chart Planner',
    description: 'Plan task dates, progress, and milestones on a project timeline.',
    category: 'Project Management',
    input: 'Tasks, dates, progress, milestones',
    output: 'Gantt timeline and JSON plan export',
    href: 'Gantt%20Chart/Gantt_Chart.html',
    categories: ['Project Management']
  },
  {
    name: 'Monte Carlo Risk Simulation',
    description: 'Simulate uncertain inputs, estimate outcome probabilities, and identify the variables that drive risk.',
    category: 'Statistics',
    input: 'Distributions, formula, target, seed',
    output: 'Outcome distribution, target probability, percentiles, and sensitivity',
    cta: 'Open Monte Carlo Simulation',
    href: 'Monte%20Carlo%20Risk%20Simulation/Monte_Carlo_Risk_Simulation.html',
    categories: ['Statistics', 'Business Analysis']
  }
];

const trust = [
  { title: 'Method Notes', body: 'Each tool is being built with plain-language guidance on what the method does, when to use it, and how to read the result.', icon: 'book' },
  { title: 'Browser-Based Work', body: 'Current tools run in the browser, so typical calculations can be completed without installing specialist software.', icon: 'shield' },
  { title: 'Useful Outputs', body: 'Results are shown as practical tables, charts, summaries, or classifications so users can act on more than a single number.', icon: 'chart' },
  { title: 'Room to Improve', body: 'Formula notes, assumptions, limitations, and examples will continue to be expanded as the tool library matures.', icon: 'settings' }
];

const learning = [
  { title: 'Guides', body: 'Clear method introductions that explain when and why to use each analytical approach.', icon: 'book' },
  { title: 'Worked Examples', body: 'Step-by-step examples that connect formulas to real operating decisions.', icon: 'calculator' },
  { title: 'Method Comparisons', body: 'Side-by-side comparisons that help users choose the right technique.', icon: 'compare' }
];

const roadmap = [
  { title: 'Available Now', body: 'Core supply chain and inventory tools.' },
  { title: 'Expanding', body: 'Forecasting, statistics, finance, operations, and engineering tools.' },
  { title: 'Future Vision', body: 'Saved analyses, comparison workspaces, reusable templates, and collaborative decision support.' }
];

const searchItems = [
  ...tools.filter((tool) => tool.href).map((tool) => ({
    title: tool.name,
    detail: `${tool.category} • ${tool.output}`,
    href: tool.href,
    type: 'tool',
    categories: tool.categories || []
  })),
  ...categories.map((category) => ({ title: category.title, detail: category.benefit, href: '#categories' })),
  ...problems.map((problem) => ({ title: problem.title, detail: problem.detail, href: problem.href }))
];

const contactEmail = 'analyticaltoolshub@gmail.com';

const legalDocuments = {
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: 'Overview',
        body: ['Analytical Tools Hub is designed as a browser-based analytical workspace. Current tools process typical calculations locally in your browser unless a tool clearly states otherwise.']
      },
      {
        heading: 'Information You Enter',
        body: ['Tool inputs may include inventory, forecasting, procurement, project, or business data that you choose to enter or upload. For the current static tools, this data is used in the browser to produce calculations, tables, charts, and exports.']
      },
      {
        heading: 'Email and Updates',
        body: ['The updates form opens an email draft addressed to Analytical Tools Hub. Newsletter delivery may be added later if a dedicated email service is configured.']
      },
      {
        heading: 'Local Files and Exports',
        body: ['When you export CSV, Excel, image, or JSON files, the files are generated for your own use. You are responsible for storing and protecting files downloaded to your device.']
      },
      {
        heading: 'Contact',
        body: [`For privacy questions, contact ${contactEmail}.`]
      }
    ]
  },
  terms: {
    title: 'Terms of Use',
    sections: [
      {
        heading: 'Use of the Site',
        body: ['Analytical Tools Hub provides practical analytical tools and educational content for general informational and decision-support purposes.']
      },
      {
        heading: 'User Responsibility',
        body: ['You are responsible for checking the data you enter, reviewing assumptions, validating outputs, and deciding whether a method is appropriate for your situation.']
      },
      {
        heading: 'No Guaranteed Availability',
        body: ['Tools may be updated, changed, removed, or expanded over time. Features labelled as coming soon are not yet available.']
      },
      {
        heading: 'Acceptable Use',
        body: ['Do not use the site in a way that attempts to disrupt, reverse engineer, overload, or misuse the tools, code, or services.']
      }
    ]
  },
  cookies: {
    title: 'Cookie Policy',
    sections: [
      {
        heading: 'Current Cookie Use',
        body: ['The current static site does not intentionally set analytics, advertising, or tracking cookies.']
      },
      {
        heading: 'Local Browser Storage',
        body: ['Some tool features may use browser storage or locally generated files to support the user experience. Where persistence exists, it should be explained in the relevant tool.']
      },
      {
        heading: 'Future Analytics',
        body: ['If analytics, embedded services, or newsletter tools are added later, this policy should be updated before those services are enabled.']
      }
    ]
  },
  disclaimer: {
    title: 'Disclaimer',
    sections: [
      {
        heading: 'Decision Support Only',
        body: ['ATH tools are provided to support analysis and learning. They do not replace professional judgement, expert review, or organisation-specific procedures.']
      },
      {
        heading: 'No Professional Advice',
        body: ['Outputs should not be treated as legal, financial, engineering, procurement, or operational advice. Consult qualified professionals where decisions carry material risk.']
      },
      {
        heading: 'Accuracy and Validation',
        body: ['Although the tools are designed to be practical and transparent, you should verify formulas, assumptions, data quality, and results before relying on outputs.']
      },
      {
        heading: 'Limitation of Liability',
        body: ['Use the tools at your own discretion. Analytical Tools Hub is not responsible for losses or decisions made from unverified inputs, assumptions, or outputs.']
      }
    ]
  }
};

const decisionPreviewMethods = {
  ahp: {
    label: 'AHP',
    badge: 'Expert Judgement',
    question: 'Which 3PL provider should we select?',
    questionLabel: 'Multi-criteria supplier selection',
    method: 'Analytic Hierarchy Process',
    explanation: 'Recommended because the decision involves several criteria, expert judgement, and trade-offs between alternatives.',
    metrics: [
      ['Experts', '5'],
      ['Criteria', '4'],
      ['Alternatives', '3']
    ],
    lists: [
      { title: 'Criteria', items: ['Service coverage', 'Delivery performance', 'Technology capability', 'Logistics cost'] },
      { title: 'Alternatives', items: ['3PL Provider A', '3PL Provider B', '3PL Provider C'] }
    ],
    analysisTitle: 'Criteria weights',
    analysis: {
      kind: 'bars',
      aria: 'Criteria weights: service coverage 34%, delivery performance 27%, technology capability 22%, logistics cost 17%',
      items: [
        ['Service coverage', '34%'],
        ['Delivery performance', '27%'],
        ['Technology capability', '22%'],
        ['Logistics cost', '17%']
      ],
      meta: [
        ['Consistency ratio', '0.07'],
        ['Consistency status', 'Acceptable']
      ]
    },
    resultTitle: 'Recommended option: 3PL Provider B',
    scores: [
      ['Provider B', '0.42'],
      ['Provider A', '0.34'],
      ['Provider C', '0.24']
    ],
    interpretation: 'Provider B ranks highest under the current expert judgements. The consistency ratio is within acceptable guidance, so the result is suitable for decision review.',
    status: 'Decision confidence: High',
    summary: 'Illustrative AHP decision workflow for selecting a 3PL provider using criteria weights, consistency review, and ranked alternatives.'
  },
  abc: {
    label: 'ABC Analysis',
    badge: 'Data-Driven',
    question: 'Which inventory items require the highest management attention?',
    questionLabel: 'Inventory prioritisation',
    method: 'ABC Analysis with optional XYZ segmentation',
    explanation: 'Recommended because the decision is based on inventory value concentration and can be extended with demand variability.',
    metrics: [
      ['SKUs', '120'],
      ['Annual inventory value', '\u00a3486k'],
      ['Analysis period', '12 months']
    ],
    lists: [
      { title: 'Classes', items: ['A items: 18', 'B items: 31', 'C items: 71'] },
      { title: 'XYZ summary', items: ['AX: 9', 'BY: 16', 'CZ: 42'] }
    ],
    analysisTitle: 'Classification pattern',
    analysis: {
      kind: 'pareto',
      aria: 'Pareto-style classification preview showing A items as the smallest count but highest management priority.',
      items: ['92%', '76%', '58%', '42%', '30%', '18%'],
      meta: [
        ['A items', '18'],
        ['B items', '31'],
        ['C items', '71']
      ]
    },
    resultTitle: 'Prioritise frequent control and accurate forecasting for A-class items.',
    interpretation: 'A-class items represent the highest management priority because they concentrate value and require tighter review routines.',
    status: 'Recommended action: Review AX items weekly',
    summary: 'Illustrative ABC Analysis workflow for identifying high-priority inventory items and reviewing AX items weekly.'
  },
  forecasting: {
    label: 'Forecasting',
    badge: 'Data-Driven',
    question: 'What is the expected demand for the next period?',
    questionLabel: 'Demand planning forecast',
    method: 'Holt-Winters Exponential Smoothing',
    explanation: 'Recommended because the demand history shows trend and seasonality over multiple periods.',
    metrics: [
      ['Historical periods', '24'],
      ['Pattern', 'Trend with seasonality'],
      ['Forecast horizon', '6 months']
    ],
    lists: [
      { title: 'Inputs', items: ['Historical demand series', 'Seasonality pattern', 'Forecast horizon'] }
    ],
    analysisTitle: 'Forecast output',
    analysis: {
      kind: 'forecast',
      aria: 'Historical and forecast line chart with a marked forecast region.',
      meta: [
        ['Next-period forecast', '1,245 units'],
        ['MAE', '68 units'],
        ['Forecast pattern', 'Stable seasonal growth']
      ]
    },
    resultTitle: 'Use the forecast as the baseline for replenishment and capacity planning.',
    interpretation: 'The forecast provides a planning baseline. Users should review assumptions and compare the output with known demand changes before acting.',
    summary: 'Illustrative forecasting workflow for estimating next-period demand and planning replenishment.'
  },
  kraljic: {
    label: 'Kraljic Matrix',
    badge: 'Hybrid',
    question: 'Which purchasing categories need strategic supplier attention?',
    questionLabel: 'Procurement portfolio decision',
    method: 'Kraljic Portfolio Matrix',
    explanation: 'Recommended because the decision combines category data with procurement risk assessment and strategic judgement.',
    metrics: [
      ['Categories assessed', '12'],
      ['Dimensions', 'Profit impact and supply risk'],
      ['Judgement input', 'Procurement risk assessment']
    ],
    lists: [
      { title: 'Sample category', items: ['Electronic components', 'Placed in: Strategic'] }
    ],
    analysisTitle: 'Portfolio position',
    analysis: {
      kind: 'matrix',
      aria: 'Kraljic matrix preview highlighting electronic components in the strategic quadrant.',
      meta: [
        ['Highlighted category', 'Electronic components'],
        ['Quadrant', 'Strategic']
      ]
    },
    resultTitle: 'Build a long-term supplier relationship and develop a supply-risk mitigation plan.',
    interpretation: 'The category sits in the strategic quadrant, so supplier relationship management and risk mitigation should receive senior attention.',
    summary: 'Illustrative Kraljic Matrix workflow for identifying strategic supplier categories.'
  }
};

function renderCards(selector, items, template) {
  const target = document.querySelector(selector);
  if (!target) return;
  if (target.children.length > 0) return;
  target.innerHTML = items.map(template).join('');
}

function initRenderedContent() {
  renderCards('[data-render="pillars"]', pillars, (item) => `
    <article class="pillar-card">
      ${icons[item.icon]}
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </article>
  `);

  renderCards('[data-render="problems"]', problems, (problem) => `
    <button type="button" data-problem="${problem.title}">${problem.title}</button>
  `);

  renderCards('[data-render="categories"]', categories, (item) => `
    <article class="category-card">
      ${icons[item.icon]}
      <h3>${item.title}</h3>
      <span class="card-meta">${item.count}</span>
      <p>${item.benefit}</p>
      <button class="card-link card-link-button" type="button" data-category-search="${item.title}" aria-label="Explore ${item.title} category">Explore category</button>
    </article>
  `);

  renderCards('[data-render="tools"]', tools, (tool) => `
    <article class="tool-card${tool.status ? ' is-coming-soon' : ''}">
      <div class="tool-card-header">
        <div>
          <span class="card-meta">${tool.category}</span>
          <h3>${tool.name}</h3>
        </div>
        <button class="bookmark-button" type="button" aria-label="Save ${tool.name}">${icons.bookmark}</button>
      </div>
      <p>${tool.description}</p>
      <div class="tool-meta">
        <span><strong>Input:</strong> ${tool.input}</span>
        <span><strong>Output:</strong> ${tool.output}</span>
      </div>
      ${tool.href
        ? `<a class="card-link" href="${tool.href}" aria-label="${tool.cta || `Open ${tool.name}`}">${tool.cta || `Open ${tool.name}`}</a>`
        : `<span class="coming-soon-label" aria-label="${tool.name} is coming soon">${tool.status || 'Coming soon'}</span>`}
    </article>
  `);

  renderCards('[data-render="trust"]', trust, (item) => `
    <article class="trust-card">
      ${icons[item.icon]}
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </article>
  `);

  renderCards('[data-render="learning"]', learning, (item) => `
    <article class="learning-card">
      ${icons[item.icon]}
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </article>
  `);

  renderCards('[data-render="roadmap"]', roadmap, (item) => `
    <article>
      <h3>${item.title}</h3>
      <p>${item.body}</p>
    </article>
  `);
}

const savedToolsStorageKey = 'ath:saved-tools:v1';

function initSavedTools() {
  const toolsGrid = document.querySelector('[data-render="tools"]');
  const filterButton = document.querySelector('[data-saved-tools-filter]');
  const savedCount = document.querySelector('[data-saved-tools-count]');
  const emptyState = document.querySelector('[data-saved-tools-empty]');
  const message = document.querySelector('[data-saved-tools-message]');
  if (!toolsGrid || !filterButton || !savedCount || !emptyState || !message) return;

  let filterActive = false;
  let messageTimer;
  let savedTools = new Set();

  try {
    const storedTools = JSON.parse(localStorage.getItem(savedToolsStorageKey) || '[]');
    if (Array.isArray(storedTools)) {
      savedTools = new Set(storedTools.filter((item) => typeof item === 'string'));
    }
  } catch {
    savedTools = new Set();
  }

  const toolCards = Array.from(toolsGrid.querySelectorAll('.tool-card')).map((card) => {
    const link = card.querySelector('.card-link[href]');
    const button = card.querySelector('.bookmark-button');
    const name = card.querySelector('h3')?.textContent.trim() || 'Tool';
    const id = link?.getAttribute('href') || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return { card, button, id, name };
  }).filter((tool) => tool.button);
  const availableToolIds = new Set(toolCards.map((tool) => tool.id));
  savedTools = new Set(Array.from(savedTools).filter((id) => availableToolIds.has(id)));

  const showMessage = (text) => {
    window.clearTimeout(messageTimer);
    message.textContent = text;
    message.hidden = false;
    messageTimer = window.setTimeout(() => {
      message.hidden = true;
    }, 2400);
  };

  const persistSavedTools = () => {
    try {
      localStorage.setItem(savedToolsStorageKey, JSON.stringify(Array.from(savedTools)));
      return true;
    } catch {
      return false;
    }
  };

  const updateBookmark = (tool) => {
    const isSaved = savedTools.has(tool.id);
    tool.card.classList.toggle('has-saved-tool', isSaved);
    tool.button.classList.toggle('is-saved', isSaved);
    tool.button.setAttribute('aria-pressed', String(isSaved));
    tool.button.setAttribute('aria-label', isSaved
      ? `Remove ${tool.name} from saved tools`
      : `Save ${tool.name}`);
    tool.button.title = isSaved
      ? `Remove ${tool.name} from saved tools`
      : `Save ${tool.name}`;
  };

  const updateSavedToolsView = () => {
    toolCards.forEach((tool) => {
      tool.card.hidden = filterActive && !savedTools.has(tool.id);
    });

    savedCount.textContent = String(savedTools.size);
    filterButton.setAttribute('aria-pressed', String(filterActive));
    filterButton.setAttribute('aria-label', filterActive
      ? 'Show all featured tools'
      : `Show saved tools (${savedTools.size})`);
    emptyState.hidden = !(filterActive && savedTools.size === 0);
  };

  toolCards.forEach((tool) => {
    updateBookmark(tool);
    tool.button.addEventListener('click', () => {
      const wasSaved = savedTools.has(tool.id);
      if (wasSaved) {
        savedTools.delete(tool.id);
      } else {
        savedTools.add(tool.id);
      }

      const persisted = persistSavedTools();
      toolCards.forEach(updateBookmark);

      if (filterActive && wasSaved) {
        filterButton.focus();
      }
      updateSavedToolsView();

      const action = wasSaved ? 'removed from' : 'saved to';
      showMessage(persisted
        ? `${tool.name} ${action} your saved tools.`
        : `${tool.name} ${action} this session. Browser storage is unavailable.`);
    });
  });

  filterButton.addEventListener('click', () => {
    filterActive = !filterActive;
    updateSavedToolsView();
    showMessage(filterActive ? 'Showing saved tools.' : 'Showing all featured tools.');
  });

  updateSavedToolsView();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function renderPreviewMetrics(metrics) {
  return `
    <div class="preview-metric-grid">
      ${metrics.map(([label, value]) => `
        <div class="${String(value).length > 9 ? 'has-text-value' : ''}">
          <strong>${escapeHtml(value)}</strong>
          <span>${escapeHtml(label)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderPreviewLists(lists) {
  return `
    <div class="preview-list-pair">
      ${lists.map((group) => `
        <div>
          <strong>${escapeHtml(group.title)}</strong>
          <ul>${group.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
        </div>
      `).join('')}
    </div>
  `;
}

function renderPreviewAnalysis(analysis) {
  if (analysis.kind === 'pareto') {
    return `
      <div class="preview-pareto" role="img" aria-label="${escapeHtml(analysis.aria)}">
        ${analysis.items.map((height) => `<i style="--height: ${escapeHtml(height)};"></i>`).join('')}
      </div>
    `;
  }

  if (analysis.kind === 'forecast') {
    return `
      <svg class="preview-forecast-chart" viewBox="0 0 420 190" role="img" aria-label="${escapeHtml(analysis.aria)}">
        <path class="chart-grid" d="M28 36H390M28 82H390M28 128H390M28 174H390"/>
        <rect class="forecast-region" x="280" y="24" width="110" height="150" rx="8"/>
        <path class="chart-band" d="M32 142C82 124 110 111 152 118S224 78 267 86 326 58 388 38v76C330 136 298 142 262 128S194 154 154 146 82 162 32 178Z"/>
        <path class="chart-line" d="M32 154C78 132 111 118 150 124S218 80 264 91"/>
        <path class="chart-forecast-line" d="M264 91C310 58 338 62 388 45"/>
      </svg>
    `;
  }

  if (analysis.kind === 'matrix') {
    return `
      <div class="preview-matrix" role="img" aria-label="${escapeHtml(analysis.aria)}">
        <div class="is-highlighted">Strategic<span class="matrix-point">Electronic components</span></div>
        <div>Leverage</div>
        <div>Bottleneck</div>
        <div>Routine</div>
      </div>
    `;
  }

  return `
    <div class="preview-bars" aria-label="${escapeHtml(analysis.aria)}">
      ${analysis.items.map(([label, value]) => `
        <div>
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <i style="--value: ${escapeHtml(value)};"></i>
        </div>
      `).join('')}
    </div>
  `;
}

function renderPreviewMeta(meta = []) {
  if (!meta.length) return '';
  return `
    <div class="preview-status-row">
      ${meta.map(([label, value]) => `
        <span class="${/status/i.test(label) ? 'is-status' : ''}">${escapeHtml(label)}: <strong>${escapeHtml(value)}</strong></span>
      `).join('')}
    </div>
  `;
}

function renderDecisionPreview(methodKey) {
  const preview = document.querySelector('[data-decision-preview]');
  const target = document.querySelector('[data-preview-content]');
  const data = decisionPreviewMethods[methodKey] || decisionPreviewMethods.ahp;
  if (!preview || !target) return;

  const tabs = preview.querySelectorAll('[data-preview-method]');
  tabs.forEach((tab) => {
    const selected = tab.dataset.previewMethod === methodKey;
    tab.setAttribute('aria-selected', String(selected));
    if (selected) target.setAttribute('aria-labelledby', tab.id);
  });

  target.classList.add('is-switching');
  window.setTimeout(() => {
    target.innerHTML = `
      <span class="preview-example-label">Example decision workflow</span>
      <article class="preview-question-card">
        <span>Decision question</span>
        <h2>${escapeHtml(data.question)}</h2>
        <p>${escapeHtml(data.questionLabel)}</p>
      </article>
      <article class="preview-method-card">
        <div>
          <span>Recommended method</span>
          <h3>${escapeHtml(data.method)}</h3>
          <p>${escapeHtml(data.explanation)}</p>
        </div>
        <strong>${escapeHtml(data.badge)}</strong>
      </article>
      <div class="preview-evidence-grid">
        <article class="preview-card">
          <span>Input summary</span>
          ${renderPreviewMetrics(data.metrics)}
          ${renderPreviewLists(data.lists)}
        </article>
        <article class="preview-card">
          <span>Analysis</span>
          <h3>${escapeHtml(data.analysisTitle)}</h3>
          ${renderPreviewAnalysis(data.analysis)}
          ${renderPreviewMeta(data.analysis.meta)}
        </article>
      </div>
      <article class="preview-result-card">
        <span>Decision result</span>
        <h3>${escapeHtml(data.resultTitle)}</h3>
        ${data.scores ? `<div class="preview-score-list" aria-label="Alternative scores">${data.scores.map(([label, value]) => `<span><strong>${escapeHtml(label)}</strong>${escapeHtml(value)}</span>`).join('')}</div>` : ''}
        <p>${escapeHtml(data.interpretation)}</p>
        ${data.status ? `<strong class="preview-confidence">${escapeHtml(data.status)}</strong>` : ''}
      </article>
      <p class="sr-only">${escapeHtml(data.summary)}</p>
    `;
    target.classList.remove('is-switching');
  }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 90);
}

function initDecisionPreview() {
  const preview = document.querySelector('[data-decision-preview]');
  if (!preview) return;
  const tabs = Array.from(preview.querySelectorAll('[data-preview-method]'));
  if (!tabs.length) return;

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => renderDecisionPreview(tab.dataset.previewMethod));
    tab.addEventListener('keydown', (event) => {
      const lastIndex = tabs.length - 1;
      let nextIndex = index;
      if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
      if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = lastIndex;
      if (nextIndex === index && !['Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      tabs[nextIndex].focus();
      renderDecisionPreview(tabs[nextIndex].dataset.previewMethod);
    });
  });

  renderDecisionPreview('ahp');
}

function initHeader() {
  const header = document.querySelector('[data-header]');
  const setHeaderState = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });
}

function initMobileMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!toggle || !menu) return;

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    menu.hidden = true;
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    menu.hidden = isOpen;
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
}

function getSearchResults(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const results = searchItems.filter((item) => `${item.title} ${item.detail}`.toLowerCase().includes(normalized));
  return results.slice(0, 7);
}

function getCategoryResults(category) {
  return searchItems.filter((item) => item.type === 'tool' && item.categories?.includes(category));
}

function renderSearchItems(items, emptyMessage) {
  const target = document.querySelector('[data-search-results]');
  if (!target) return;
  target.innerHTML = items.length
    ? items.map((item) => {
      const label = item.detail.toLowerCase().startsWith('recommended') ? '<em>Recommended</em>' : '';
      return `<a href="${item.href}">${label}<strong>${item.title}</strong><span>${item.detail}</span></a>`;
    }).join('')
    : `<p class="search-empty">${emptyMessage}</p>`;
}

function renderSearchResults(query = '') {
  const target = document.querySelector('[data-search-results]');
  if (!target) return;
  if (!query.trim()) {
    target.innerHTML = '<p class="search-empty">Start typing a tool, method, or business problem.</p>';
    return;
  }

  const results = getSearchResults(query);
  renderSearchItems(results, 'No exact match yet. Try a method, category, or practical question.');
}

function initSearch() {
  const modal = document.querySelector('[data-search-modal]');
  const input = document.querySelector('[data-search-input]');
  const openButtons = document.querySelectorAll('[data-search-open]');
  const closeButtons = document.querySelectorAll('[data-search-close]');
  if (!modal || !input) return;

  const openSearch = () => {
    modal.hidden = false;
    document.body.classList.add('modal-open');
    renderSearchResults(input.value);
    window.setTimeout(() => input.focus(), 0);
  };

  const openCategorySearch = (category) => {
    input.value = category;
    modal.hidden = false;
    document.body.classList.add('modal-open');
    renderSearchItems(
      getCategoryResults(category),
      `No available tools in ${category} yet. This category is expanding soon.`
    );
    window.setTimeout(() => input.focus(), 0);
  };

  const closeSearch = () => {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  };

  openButtons.forEach((button) => button.addEventListener('click', openSearch));
  closeButtons.forEach((button) => button.addEventListener('click', closeSearch));
  input.addEventListener('input', () => renderSearchResults(input.value));
  document.querySelector('[data-search-results]')?.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link?.getAttribute('href')?.startsWith('#')) closeSearch();
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openSearch();
    }
    if (event.key === 'Escape' && !modal.hidden) closeSearch();
  });

  document.addEventListener('click', (event) => {
    const problem = event.target.closest('[data-problem]');
    if (problem) {
      input.value = problem.dataset.problem;
      openSearch();
      return;
    }

    const category = event.target.closest('[data-category-search]');
    if (!category) return;
    openCategorySearch(category.dataset.categorySearch);
  });
}

function initNewsletter() {
  const form = document.querySelector('[data-newsletter]');
  const message = document.querySelector('[data-form-message]');
  if (!form || !message) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = new FormData(form).get('email')?.toString().trim() || '';
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    message.classList.remove('error', 'success');

    if (!valid) {
      message.textContent = 'Enter a valid email address to register interest.';
      message.classList.add('error');
      form.querySelector('input')?.focus();
      return;
    }

    const subject = encodeURIComponent('Register interest in Analytical Tools Hub updates');
    const body = encodeURIComponent(`Hello Analytical Tools Hub,\n\nPlease register my interest in future ATH updates.\n\nEmail: ${email}\n\nThank you.`);
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;

    message.textContent = 'Your email app should open with a prefilled message to ATH.';
    message.classList.add('success');
    form.reset();
  });
}

function initLegalModal() {
  const modal = document.querySelector('[data-legal-modal]');
  const title = document.querySelector('[data-legal-title]');
  const content = document.querySelector('[data-legal-content]');
  const openButtons = document.querySelectorAll('[data-legal-open]');
  const closeButtons = document.querySelectorAll('[data-legal-close]');
  if (!modal || !title || !content) return;

  const renderLegalDocument = (documentKey) => {
    const document = legalDocuments[documentKey];
    if (!document) return;

    title.textContent = document.title;
    content.innerHTML = document.sections.map((section) => `
      <section>
        <h3>${section.heading}</h3>
        ${section.body.map((paragraph) => `<p>${paragraph}</p>`).join('')}
      </section>
    `).join('');
  };

  const openLegal = (documentKey) => {
    renderLegalDocument(documentKey);
    modal.hidden = false;
    document.body.classList.add('modal-open');
    modal.querySelector('[data-legal-close]')?.focus();
  };

  const closeLegal = () => {
    modal.hidden = true;
    document.body.classList.remove('modal-open');
  };

  openButtons.forEach((button) => {
    button.addEventListener('click', () => openLegal(button.dataset.legalOpen));
  });
  closeButtons.forEach((button) => button.addEventListener('click', closeLegal));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeLegal();
  });
}

initRenderedContent();
initSavedTools();
initDecisionPreview();
initHeader();
initMobileMenu();
initSearch();
initNewsletter();
initLegalModal();
