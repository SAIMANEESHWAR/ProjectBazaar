import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

const CODING_LOGOS_BASE = '/coding_logos';

const skills: { file: string; label: string }[] = [
  { file: 'skill_logo_android.png', label: 'Android' },
  { file: 'skill_logo_angular.png', label: 'Angular' },
  { file: 'skill_logo_ansible.png', label: 'Ansible' },
  { file: 'skill_logo_automation_anywhere.png', label: 'Automation' },
  { file: 'skill_logo_aws.png', label: 'AWS' },
  { file: 'skill_logo_azure.png', label: 'Azure' },
  { file: 'skill_logo_bash.png', label: 'Bash' },
  { file: 'skill_logo_blue_prism.png', label: 'Blue Prism' },
  { file: 'skill_logo_c.png', label: 'C' },
  { file: 'skill_logo_cpp.png', label: 'C++' },
  { file: 'skill_logo_csharp.png', label: 'C#/.NET' },
  { file: 'skill_logo_clojure.png', label: 'Clojure' },
  { file: 'skill_logo_dart.png', label: 'Dart/Flutter' },
  { file: 'skill_logo_databricks.png', label: 'Databricks' },
  { file: 'skill_logo_django.png', label: 'Django' },
  { file: 'skill_logo_dockerfile.png', label: 'Docker' },
  { file: 'skill_logo_elixir.png', label: 'Elixir' },
  { file: 'skill_logo_excel.png', label: 'Excel' },
  { file: 'skill_logo_git.png', label: 'Git' },
  { file: 'skill_logo_graphql.png', label: 'GraphQL' },
  { file: 'skill_logo_hubspot.png', label: 'HubSpot' },
  { file: 'skill_logo_ios.png', label: 'iOS' },
  { file: 'skill_logo_java_notext.png', label: 'Java/Spring' },
  { file: 'skill_logo_js.jpg', label: 'JavaScript' },
  { file: 'skill_logo_laravel.png', label: 'Laravel' },
  { file: 'skill_logo_mongodb.png', label: 'MongoDB' },
  { file: 'skill_logo_nodejs.png', label: 'Node.js' },
  { file: 'skill_logo_oracle.png', label: 'Oracle' },
  { file: 'skill_logo_php.png', label: 'PHP' },
  { file: 'skill_logo_powershell.png', label: 'PowerShell' },
  { file: 'skill_logo_pytorch.png', label: 'PyTorch' },
  { file: 'skill_logo_react.png', label: 'React/React Native' },
  { file: 'skill_logo_salesforce.png', label: 'Salesforce/Apex' },
  { file: 'skill_logo_svelte.png', label: 'Svelte' },
  { file: 'skill_logo_swift.png', label: 'Swift' },
  { file: 'skill_logo_tensorflow.png', label: 'TensorFlow' },
  { file: 'skill_logo_terraform.png', label: 'Terraform' },
  { file: 'skill_logo_typescript.jpg', label: 'TypeScript' },
  { file: 'skill_logo_unity.png', label: 'Unity' },
  { file: 'skill_logo_vue.png', label: 'Vue.js' },
];

const LanguagesSkillsSection: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      className="relative py-24 md:py-32 bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300"
    >
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold leading-tight tracking-tight text-[#1a1a1a] dark:text-white">
            Languages, skills & technologies in our projects
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Browse and filter projects by the tech stack you need—from web and mobile to cloud and data.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-[#111] p-6 md:p-8"
        >
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {skills.map((skill, i) => (
              <motion.button
                key={skill.file}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.35, delay: 0.05 + (i % 20) * 0.02 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 text-sm font-medium hover:border-[#ff7a00]/40 hover:shadow-md transition-all duration-200"
              >
                <img
                  src={`${CODING_LOGOS_BASE}/${skill.file}`}
                  alt={skill.label}
                  className="w-6 h-6 object-contain flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <span>{skill.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LanguagesSkillsSection;
