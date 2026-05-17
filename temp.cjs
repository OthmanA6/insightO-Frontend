const fs = require('fs');
const files = [
  'src/features/DepartmentManagement/pages/DepartmentDetailPage.tsx',
  'src/features/TaskManagement/components/SubmitTaskModal.tsx',
  'src/features/TaskManagement/components/TaskModal.tsx',
  'src/features/TaskManagement/pages/CourseTasksView.tsx',
  'src/features/TaskManagement/pages/TaskManagementPage.tsx',
  'src/features/TaskManagement/pages/TaskSubmissionsPage.tsx'
];

for (let file of files) {
  if (!fs.existsSync(file)) { console.log('not found: ' + file); continue; }
  let content = fs.readFileSync(file, 'utf8');

  // 1. Remove blurs
  content = content.replace(/backdrop-blur-md/g, '').replace(/backdrop-blur/g, '');

  // 2. Remove shadows
  content = content.replace(/shadow-2xl/g, '').replace(/shadow-xl/g, '').replace(/shadow-lg/g, '');
  content = content.replace(/hover:shadow-\[[^\]]+\]/g, '');
  content = content.replace(/hover:shadow-[a-zA-Z0-9-\/]+/g, '');
  
  // 3. Transitions
  content = content.replace(/transition-all duration-300/g, 'transition-[border-color,background-color] duration-300');
  content = content.replace(/transition-all/g, 'transition-[border-color,background-color]');

  // 4. Backgrounds
  content = content.replace(/bg-indigo-950\/10/g, 'bg-[#13151f]');
  content = content.replace(/bg-\[#1e1b2e\]/g, 'bg-[#13151f]');
  content = content.replace(/bg-white\/5/g, 'bg-[#1a1d29]');
  
  // Modal Background Fixes
  content = content.replace(/bg-\[#0a0a0f\]/g, 'bg-[#0a0a0f]');
  
  // 5. Hover effects
  content = content.replace(/hover:border-indigo-500\/30 hover:shadow-indigo-500\/10/g, 'hover:border-indigo-500/50');
  content = content.replace(/hover:border-indigo-500\/30/g, 'hover:border-indigo-500/50');

  // Clean up extra spaces
  content = content.replace(/ +/g, ' ').replace(/ \"/g, '\"').replace(/\" /g, '\"').replace(/className=\" /g, 'className=\"');
  
  fs.writeFileSync(file, content);
  console.log('Processed ' + file);
}
