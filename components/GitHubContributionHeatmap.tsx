import React, { useState, useEffect } from 'react';

interface ContributionData {
  date: string;
  count: number;
  level: number;
}

interface ContributionsResponse {
  total: Record<string, number>;
  contributions: ContributionData[];
}

interface GitHubContributionHeatmapProps {
  username: string;
  selectedYear: number;
}

const GitHubContributionHeatmap: React.FC<GitHubContributionHeatmapProps> = ({ username, selectedYear }) => {
  const [contributions, setContributions] = useState<ContributionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContributions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch contribution data');
        }
        
        const data: ContributionsResponse = await response.json();
        setContributions(data);
      } catch (err) {
        console.error('Error fetching contributions:', err);
        setError('Failed to load contribution data');
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchContributions();
    }
  }, [username]);

  // Filter contributions for selected year
  const yearContributions = contributions?.contributions.filter(c => {
    const year = new Date(c.date).getFullYear();
    return year === selectedYear;
  }) || [];

  // Get total for selected year
  const yearTotal = contributions?.total[selectedYear.toString()] || 0;

  // Create a map of date to contribution for easy lookup
  const contributionMap = new Map<string, ContributionData>();
  yearContributions.forEach(c => {
    contributionMap.set(c.date, c);
  });

  // Get first and last day of year
  const firstDay = new Date(selectedYear, 0, 1);
  const lastDay = new Date(selectedYear, 11, 31);
  
  // Calculate weeks (53 weeks max)
  const weeks: (ContributionData | null)[][] = [];
  const startDate = new Date(firstDay);
  
  // Adjust to start of week (Sunday)
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  
  // Generate 53 weeks
  for (let week = 0; week < 53; week++) {
    const weekData: (ContributionData | null)[] = [];
    
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (week * 7) + day);
      
      // Check if date is within the year
      if (currentDate >= firstDay && currentDate <= lastDay) {
        const dateStr = currentDate.toISOString().split('T')[0];
        weekData.push(contributionMap.get(dateStr) || null);
      } else {
        weekData.push(null);
      }
    }
    
    weeks.push(weekData);
  }

  // Get color based on level
  const getColor = (level: number): string => {
    switch (level) {
      case 0: return '#ebedf0'; // No contributions
      case 1: return '#9be9a8'; // 1-3 contributions
      case 2: return '#40c463'; // 4-6 contributions
      case 3: return '#30a14e'; // 7-9 contributions
      case 4: return '#216e39'; // 10+ contributions
      default: return '#ebedf0';
    }
  };

  // Get month labels and positions
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthPositions: { month: number; week: number }[] = [];
  
  // Calculate startDate for month positioning (same as above)
  const startDateForMonths = new Date(firstDay);
  const dayOfWeekForStart = startDateForMonths.getDay();
  startDateForMonths.setDate(startDateForMonths.getDate() - dayOfWeekForStart);
  
  // Find first occurrence of each month
  for (let month = 0; month < 12; month++) {
    const firstDayOfMonth = new Date(selectedYear, month, 1);
    
    // Calculate which week this falls into
    const daysFromStart = Math.floor((firstDayOfMonth.getTime() - startDateForMonths.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(daysFromStart / 7);
    
    if (weekIndex >= 0 && weekIndex < 53) {
      monthPositions.push({ month, week: weekIndex });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (!contributions || yearContributions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 text-sm">
        No contribution data available for {selectedYear}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Month Labels */}
      <div className="flex mb-2 relative" style={{ paddingLeft: '30px', height: '15px' }}>
        {monthPositions.map(({ month, week }) => (
          <div
            key={month}
            className="text-xs text-gray-500 absolute"
            style={{ 
              left: `${(week / 53) * 100}%`,
              transform: 'translateX(0)'
            }}
          >
            {monthLabels[month]}
          </div>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="flex gap-1">
        {/* Day Labels */}
        <div className="flex flex-col gap-1 mr-2">
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, index) => (
            <div key={index} className="text-xs text-gray-500 h-3.5 flex items-center">
              {day}
            </div>
          ))}
        </div>

        {/* Contribution Grid */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((contribution, dayIndex) => {
                if (contribution === null) {
                  return (
                    <div
                      key={dayIndex}
                      className="w-3.5 h-3.5 rounded-sm opacity-0"
                    />
                  );
                }

                const level = contribution.level;
                const count = contribution.count;
                const date = contribution.date;

                return (
                  <div
                    key={dayIndex}
                    className="w-3.5 h-3.5 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-orange-400 hover:ring-offset-1"
                    style={{ backgroundColor: getColor(level) }}
                    title={`${date}: ${count} contribution${count !== 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend and Stats */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ebedf0' }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#9be9a8' }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#40c463' }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#30a14e' }}></div>
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#216e39' }}></div>
          </div>
          <span>More</span>
        </div>
        <div className="text-sm text-gray-700 font-medium">
          {yearTotal} contribution{yearTotal !== 1 ? 's' : ''} in {selectedYear}
        </div>
      </div>
    </div>
  );
};

export default GitHubContributionHeatmap;
export type { GitHubContributionHeatmapProps };

