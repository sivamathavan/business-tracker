const fs = require('fs');
const path = require('path');

const directory = '/Volumes/Maddy/tracker';

const replacements = [
  { search: /AadanaTharakar/g, replace: 'DkProperties' },
  { search: /aadanatharakar/g, replace: 'dkproperties' },
  { search: /CKS Tuition/g, replace: 'AchieversNest' }
];

const filesToUpdate = [
  'client/src/App.tsx',
  'client/src/components/layout/Sidebar.tsx',
  'client/src/components/ui/ExpensesTab.tsx',
  'client/src/pages/auth/Login.tsx',
  'client/src/pages/admin/AdminDashboard.tsx',
  'client/src/pages/coaching/CoachingDashboard.tsx',
  'client/src/pages/realestate/re-hooks.ts',
  'client/src/pages/realestate/re-types.ts',
  'client/src/pages/realestate/ReOverviewTab.tsx',
  'client/src/pages/realestate/ReCommissionTab.tsx',
  'client/src/pages/realestate/ReAnalyticsTab.tsx',
  'client/src/pages/realestate/re-ui.tsx',
  'client/src/pages/realestate/RePropertiesTab.tsx',
  'client/src/pages/realestate/RePeopleTab.tsx',
  'client/src/pages/realestate/ReDealsTab.tsx',
  'client/src/pages/realestate/ReMatchTab.tsx',
  'server/src/controllers/expense.controller.ts',
  'server/src/controllers/admin.controller.ts',
  'server/src/controllers/coaching.controller.ts',
  'server/src/prisma/seed.ts'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(directory, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Special case: don't remove existing 'aadanatharakar' from roles, append to it instead.
    if (file === 'client/src/components/layout/Sidebar.tsx') {
      content = content.replace(/roles: \['ADMIN', 'aadanatharakar'\]/g, "roles: ['ADMIN', 'aadanatharakar', 'dkproperties']");
    }

    replacements.forEach(({ search, replace }) => {
      content = content.replace(search, replace);
    });

    // Fix up Sidebar role if it was accidentally replaced again
    if (file === 'client/src/components/layout/Sidebar.tsx') {
      content = content.replace(/roles: \['ADMIN', 'dkproperties', 'dkproperties'\]/g, "roles: ['ADMIN', 'aadanatharakar', 'dkproperties']");
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
