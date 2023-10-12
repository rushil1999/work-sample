export function buildEventsByDocumentNameMap(events: any[]): Map<string, any[]> {
  const eventsByDatabaseNameMap = new Map<string, any[]>();
  events.forEach((event) => {
    const {
      ns: { coll: documentName },
    } = event;
    const existing = eventsByDatabaseNameMap.get(documentName) ?? [];
    eventsByDatabaseNameMap.set(documentName, [...existing, event]);
  });
  return eventsByDatabaseNameMap;
}

export function buildEventsByOperationMap(events: any[]): Map<string, any[]> {
  const eventsByOperationMap = new Map<string, any[]>();
  events.forEach((event) => {
    const { operationType } = event;
    const existing = eventsByOperationMap.get(operationType) ?? [];
    eventsByOperationMap.set(operationType, [...existing, event]);
  });
  return eventsByOperationMap;
}
