// Panel to edit statuses

import StatusItem from './StatusItem';

function StatusView({ statuses, onStatusChanged, onStatusDeleted }) {
    return (
        <div>
            <h2>Edit Statuses</h2>
            <ul>
                {statuses.map(status => (
                    <StatusItem
                        key = {status.id}
                        status = {status}
                        onStatusChanged={onStatusChanged}
                        onStatusDeleted={onStatusDeleted}
                    />
                ))}
            </ul>
        </div>
    );
}

export default StatusView;