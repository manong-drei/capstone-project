const entryOrder = (a, b) =>
  new Date(a.returned_at || a.created_at) - new Date(b.returned_at || b.created_at) ||
  Number(Boolean(a.returned_at)) - Number(Boolean(b.returned_at)) || a.id - b.id;

function projectQueue(waiting, lastCalled) {
  const result = waiting.filter(q => q.type === 'priority').sort(entryOrder);
  const regular = waiting.filter(q => q.type !== 'priority').sort(entryOrder);
  const sources = [regular.filter(q => !q.is_walk_in), regular.filter(q => q.is_walk_in)];
  const previous = result.at(-1) || lastCalled;
  let source = previous ? Number(!previous.is_walk_in) : 0;
  const eligible = ticket => {
    if (!ticket) return false;
    // A return rejoins behind everyone already waiting in its priority group.
    if (ticket.returned_at) return !sources.flat().some(q => entryOrder(q, ticket) < 0);
    if (!ticket.is_walk_in && !ticket.last_called_at) {
      return !sources[1].some(q => !q.last_called_at && !q.returned_at && entryOrder(q, ticket) < 0);
    }
    return true;
  };
  while (sources[0].length || sources[1].length) {
    if (!eligible(sources[source][0])) source = 1 - source;
    result.push(sources[source].shift());
    source = 1 - source;
  }
  return result;
}
const alertState = (position, threshold) => position <= threshold ? 'suppressed' : 'armed';
module.exports = { projectQueue, alertState };
