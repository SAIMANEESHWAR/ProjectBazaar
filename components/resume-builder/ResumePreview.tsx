import React from 'react';
import { useResumeInfo } from '../../context/ResumeInfoContext';
import { getTemplateComponent, richTextStyles } from './ResumeTemplates';

const ResumePreview: React.FC = () => {
  const { resumeInfo } = useResumeInfo();
  const themeColor = resumeInfo.themeColor || '#f97316';
  const template = resumeInfo.template || 'classic';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const TemplateComponent = getTemplateComponent(template);

  return (
    <>
      <style>{richTextStyles}</style>
      <TemplateComponent 
        resumeInfo={resumeInfo} 
        themeColor={themeColor} 
        formatDate={formatDate}
      />
    </>
  );
};

export default ResumePreview;
