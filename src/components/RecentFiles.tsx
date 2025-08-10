import React from "react";

type Experiment = {
    id: string;
    title: string;
    updatedAt: string;
};

type RecentFilesProps = {
    experiments: Experiment[];
    onExperimentClick: (experimentId: string) => void;
};

const RecentFiles: React.FC<RecentFilesProps> = ({ experiments, onExperimentClick }) => {
    return (
    <div className="recent-files p-4 bg-gray-100 rounded shadow">
        <h2 className="text-lg font-bold mb-2">最近使用したエクスペリメント</h2>
        {experiments.length === 0 ? (
        <p className="text-gray-500">エクスペリメントはありません</p>
        ) : (
        <div className="overflow-x-auto">
            <div className="flex space-x-4 pb-2">
            {experiments.map((experiment) => (
                <div
                key={experiment.id}
                className="flex-shrink-0 min-w-32 p-4 bg-white rounded-lg border hover:bg-blue-50 cursor-pointer shadow-sm"
                onClick={() => onExperimentClick(experiment.id)}
                >
                <h3 className="text-sm font-medium text-gray-800 text-center">
                    {experiment.title}
                </h3>
                </div>
            ))}
            </div>
        </div>
        )}
    </div>
    );
};

export default RecentFiles;