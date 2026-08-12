interface CharCountProps {
    value: string;
    max: number;
}

function CharCounter({ value, max }: CharCountProps) {
    const remaining = max - value.length;

    return (
        <span className={`char-count${remaining <= 10 ? ' is-near' : ''}`}>
            {value.length}/{max}
        </span>
    );
}

export default CharCounter;