// Alternation is between sources; priority applies within each source.
function projectQueue(waiting, lastCalled) {
  const sorted = [...waiting].sort((a, b) =>
    Number(b.type === 'priority') - Number(a.type === 'priority') ||
    new Date(a.created_at) - new Date(b.created_at) || a.id - b.id);
  const sources = [sorted.filter(q => !q.is_walk_in), sorted.filter(q => q.is_walk_in)];
  let source = lastCalled ? Number(!lastCalled.is_walk_in) : 0;
  const result = [];
  while (sources[0].length || sources[1].length) {
    if (!sources[source].length) source = 1 - source;
    result.push(sources[source].shift());
    source = 1 - source;
  }
  return result;
}
const alertState = (position, threshold) => position <= threshold ? 'suppressed' : 'armed';
module.exports = { projectQueue, alertState };
