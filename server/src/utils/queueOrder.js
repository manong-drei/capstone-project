const entryOrder = (a, b) =>
  new Date(a.returned_at || a.created_at) - new Date(b.returned_at || b.created_at) ||
  Number(Boolean(a.returned_at)) - Number(Boolean(b.returned_at)) || a.id - b.id;

function projectQueue(waiting, lastCalled) {
  const held = waiting.filter(q => q.held_insert_order != null)
    .sort((a, b) => a.held_insert_order - b.held_insert_order || a.id - b.id);
  waiting = waiting.filter(q => q.held_insert_order == null);
  if (held.length) lastCalled = held[held.length - 1];
  const groups = [
    waiting.filter(q => q.type === 'priority').sort(entryOrder),
    waiting.filter(q => q.type !== 'priority').sort(entryOrder),
  ];
  const result = [...held];
  let group = lastCalled?.type === 'priority' ? 1 : 0;
  while (groups[0].length || groups[1].length) {
    if (!groups[group].length) group = 1 - group;
    result.push(groups[group].shift());
    group = 1 - group;
  }
  return result;
}
const alertState = (position, threshold) => position <= threshold ? 'suppressed' : 'armed';
module.exports = { projectQueue, alertState };
