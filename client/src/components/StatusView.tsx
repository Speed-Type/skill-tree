// Panel to edit statuses

import StatusItem from './StatusItem';

import { Status, StatusChangedHandler, StatusDeletedHandler } from '../../../shared/types';

interface StatusViewProps {
    statuses: Status[];
    onStatusChanged: StatusChangedHandler;
    onStatusDeleted: StatusDeletedHandler;
}

function StatusView({ statuses, onStatusChanged, onStatusDeleted }: StatusViewProps) {
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