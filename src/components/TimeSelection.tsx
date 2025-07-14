import React from 'react';
import { Clock, Calendar } from 'lucide-react';

interface TimeSelectionProps {
    selectedTime: string;
    onTimeSelect: (time: string) => void;
    selectedDate?: string;
    onDateChange?: () => void;
}

const TimeSelection: React.FC<TimeSelectionProps> = ({
    selectedTime,
    onTimeSelect,
    selectedDate,
    onDateChange
}) => {
    const availableTimes = [
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
        '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'
    ];

    const formatSelectedDate = (dateString: string) => {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                        <Clock className="w-4 h-4 text-gold" />
                    </div>
                    <label className="text-sm font-medium text-text-secondary uppercase tracking-wide">
                        Choose Your Preferred Time
                    </label>
                </div>
                {onDateChange && (
                    <button
                        type="button"
                        onClick={onDateChange}
                        className="text-sm text-gold hover:text-gold/80 transition-colors flex items-center gap-1"
                    >
                        <Calendar className="w-3 h-3" />
                        Change Date
                    </button>
                )}
            </div>

            {selectedDate && (
                <div className="bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/30 p-4 sm:p-5 rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gold/30 rounded-full flex items-center justify-center">
                            <Calendar className="w-3 h-3 text-gold" />
                        </div>
                        <p className="text-gold font-semibold text-sm sm:text-base">
                            {formatSelectedDate(selectedDate)}
                        </p>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableTimes.map((time) => (
                        <button
                            key={time}
                            type="button"
                            onClick={() => onTimeSelect(time)}
                            className={`group relative p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 text-center overflow-hidden ${selectedTime === time
                                    ? 'border-gold bg-gradient-to-br from-gold/20 to-gold/10 text-gold font-bold shadow-lg ring-2 ring-gold/30'
                                    : 'border-graphite bg-gradient-to-br from-surface to-accent hover:border-gold/50 hover:bg-gradient-to-br hover:from-gold/5 hover:to-gold/10 text-text-primary hover:text-gold hover:shadow-md'
                                }`}
                        >
                            {/* Subtle background animation */}
                            <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 ${selectedTime === time ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                } bg-gradient-to-br from-gold/10 to-gold/5`} />

                            <span className="relative z-10 text-sm sm:text-base font-medium">
                                {time}
                            </span>

                            {selectedTime === time && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full shadow-lg animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="bg-accent/50 border border-graphite/50 p-3 sm:p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary">
                        <Clock className="w-4 h-4 text-gold flex-shrink-0" />
                        <span>
                            All times shown in Eastern Time (EST). Consultations typically last 30-45 minutes.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimeSelection;
