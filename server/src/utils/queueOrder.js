// Alternation is between sources; priority applies within each source.
function projectQueue(waiting, lastCalled) {
  const returned = waiting.filter(q => q.returned_at).sort((a, b) =>
    new Date(a.returned_at) - new Date(b.returned_at) || a.id - b.id);
  const sorted = waiting.filter(q => !q.returned_at).sort((a, b) =>
    Number(b.type === 'priority') - Number(a.type === 'priority') ||
    new Date(a.created_at) - new Date(b.created_at) || a.id - b.id);
  const sources = [sorted.filter(q => !q.is_walk_in), sorted.filter(q => q.is_walk_in)];
  const previous = returned.at(-1) || lastCalled;
  let source = previous ? Number(!previous.is_walk_in) : 0;
  const result = [...returned];
  while (sources[0].length || sources[1].length) {
    if (!sources[source].length) source = 1 - source;
    result.push(sources[source].shift());
    source = 1 - source;
  }
  return result;
}
const alertState = (position, threshold) => position <= threshold ? 'suppressed' : 'armed';
module.exports = { projectQueue, alertState };
