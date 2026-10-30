// Synthetic deterministic fixture; not a deployed application.
export function exportTasks(rows) {
  const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
  return ['title,status', ...rows.map((row) => `${quote(row.title)},${quote(row.status)}`)].join('\n');
}

if (process.argv[2] === '--sample') {
  console.log(JSON.stringify({
    fixture: true,
    result: exportTasks([{ title: 'Draft', status: 'done', owner: 'ignored' }]),
  }));
}
