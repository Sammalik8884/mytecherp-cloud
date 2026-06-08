import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileCheck } from 'lucide-react';
import { SiteDto } from '../../types/site';
import { siteService } from '../../services/siteService';
import { ProjectSpotCheck, ProjectSpotCheckItem, createProjectSpotCheck, updateProjectSpotCheck } from '../../services/projectSpotCheckService';
import { siteDocumentService } from '../../services/siteDocumentService';

interface ProjectSpotCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  spotCheck: ProjectSpotCheck | null;
  onSuccess: () => void;
  isViewOnly?: boolean;
}

const PREDEFINED_ITEMS = [
  "Are walkways and work areas free of obstructions?",
  "Are emergency exits clearly marked and accessible?",
  "Are fire extinguishers accessible and inspected?",
  "Is PPE available and being used correctly?",
  "Are first aid kits accessible and stocked?",
  "Is signage posted for restricted and hazardous areas?",
  "Are lighting and ventilation adequate?",
  "Are electrical panels closed and labeled properly?",
  "Are wires, cords, and cables in good condition (no exposed wires)?",
  "Are extension cords used only temporarily?",
  "Are electrical tools and equipment inspected regularly?",
  "Are outlets and switches in good condition?",
  "Are grounding practices in place and verified?",
  "Are circuit breakers labeled and accessible?",
  "Is fall protection equipment available and used?",
  "Are workers trained on height safety procedures?",
  "Are ladders and scaffolding in good condition and secure?",
  "Are tools and materials secured to prevent falling?",
  "Is there a designated safety monitor or supervisor?",
  "Are emergency rescue procedures established and known?",
  "Are floors, aisles, and work areas clean and free of debris?",
  "Are materials and equipment stored properly?",
  "Is waste segregated and disposed of correctly?",
  "Are spillages cleaned up promptly?",
  "Is the area free of pests or signs of infestation?",
  "Is ventilation and temperature control adequate?"
];

export const ProjectSpotCheckModal: React.FC<ProjectSpotCheckModalProps> = ({
  isOpen,
  onClose,
  spotCheck,
  onSuccess,
  isViewOnly = false
}) => {
  const [sites, setSites] = useState<SiteDto[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<number | ''>('');
  const [items, setItems] = useState<ProjectSpotCheckItem[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchSites = async () => {
      try {
        const data = await siteService.getAll();
        if (mounted && Array.isArray(data)) {
          setSites(data);
        }
      } catch (err) {
        console.error('Failed to fetch sites:', err);
      }
    };
    fetchSites();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (spotCheck && Array.isArray(spotCheck.items)) {
      setSelectedSiteId(spotCheck.siteId || '');
      setItems(spotCheck.items);
    } else {
      setSelectedSiteId('');
      setItems(PREDEFINED_ITEMS.map(itemText => ({
        itemText,
        isYes: false,
        isNo: false,
        isNA: false,
        comments: ''
      })));
    }
    setFiles([]);
    setError(null);
  }, [spotCheck, isOpen]);

  // VERY IMPORTANT: Early return after all hooks are called
  if (!isOpen) return null;

  const handleAddCustomItem = () => {
    setItems(prev => [
      ...prev,
      { itemText: '', isYes: false, isNo: false, isNA: false, comments: '' }
    ]);
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleItemChange = (index: number, field: keyof ProjectSpotCheckItem, value: string | boolean) => {
    setItems(prevItems => {
      const newItems = [...prevItems];
      const currentItem = { ...newItems[index] };
      
      if (field === 'isYes' || field === 'isNo' || field === 'isNA') {
        currentItem.isYes = false;
        currentItem.isNo = false;
        currentItem.isNA = false;
        currentItem[field] = value as boolean;
      } else if (field === 'itemText' || field === 'comments') {
        currentItem[field] = value as string;
      }
      
      newItems[index] = currentItem;
      return newItems;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId) {
      setError('Please select a site');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      let uploadedFileUrls = spotCheck?.uploadedFiles || '';

      if (files.length > 0) {
         try {
           const result = await siteDocumentService.uploadDocuments(
             Number(selectedSiteId),
             'Project Spot Check',
             undefined,
             undefined,
             files
           );
           
           if (Array.isArray(result) && result.length > 0) {
              const newUrls = result.map(doc => doc.fileUrl).filter(Boolean);
              if (newUrls.length > 0) {
                 const currentUrls = uploadedFileUrls ? JSON.parse(uploadedFileUrls) : [];
                 uploadedFileUrls = JSON.stringify([...(Array.isArray(currentUrls) ? currentUrls : []), ...newUrls]);
              }
           }
         } catch (uploadError) {
           console.error("Failed to upload files to site documents", uploadError);
         }
      }

      const payload = {
        siteId: Number(selectedSiteId),
        items: items,
        uploadedFiles: uploadedFileUrls
      };

      if (spotCheck && spotCheck.id) {
        await updateProjectSpotCheck(spotCheck.id, payload);
      } else {
        await createProjectSpotCheck(payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred while saving the spot check');
    } finally {
      setLoading(false);
    }
  };

  const renderExistingFiles = () => {
    if (!spotCheck?.uploadedFiles) return null;
    try {
       const urls = JSON.parse(spotCheck.uploadedFiles);
       if (!Array.isArray(urls) || urls.length === 0) return null;
       return (
         <div className="mt-4 mb-4">
           <h4 className="text-sm font-medium mb-2">Attached Files</h4>
           <div className="space-y-2">
             {urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-primary text-sm hover:underline">
                  Attachment {i + 1}
                </a>
             ))}
           </div>
         </div>
       );
    } catch {
       return null;
    }
  };

  // Safe renderer to ensure we never crash on undefined arrays
  const safeSites = Array.isArray(sites) ? sites : [];
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose} />
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-background rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-background px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-2 rounded-full">
                     <FileCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl leading-6 font-semibold text-foreground" id="modal-title">
                    {isViewOnly ? 'View Project Spot Check Site' : spotCheck ? 'Edit Project Spot Check Site' : 'Project Spot Check Site'}
                  </h3>
                </div>
                <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="h-6 w-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-destructive/10 border-l-4 border-destructive p-4 text-destructive rounded-md">
                  <p>{error}</p>
                </div>
              )}

              <div className="mb-6 bg-muted/30 p-4 rounded-lg">
                <label htmlFor="site-select" className="block text-sm font-medium text-foreground mb-2">Select Site</label>
                <select
                  id="site-select"
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value ? Number(e.target.value) : '')}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-input focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-background"
                  required
                  disabled={isViewOnly}
                >
                  <option value="">Select a Site</option>
                  {safeSites.map(site => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>

              <div className="overflow-x-auto border border-border rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">No.</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[300px]">Items</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Yes</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">No</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">NA</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Comments/Action Required</th>
                      {!isViewOnly && <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-16">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {safeItems.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground text-center">
                          {index + 1}:
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          {index < PREDEFINED_ITEMS.length ? (
                            <span className="break-words block">{item.itemText}</span>
                          ) : (
                            <input
                              type="text"
                              value={item.itemText || ''}
                              onChange={(e) => handleItemChange(index, 'itemText', e.target.value)}
                              className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-input rounded-md bg-background px-3 py-2 border"
                              placeholder="Enter custom item text"
                              disabled={isViewOnly}
                              required
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <input
                            type="checkbox"
                            checked={item.isYes || false}
                            onChange={(e) => handleItemChange(index, 'isYes', e.target.checked)}
                            disabled={isViewOnly}
                            className="h-5 w-5 text-primary focus:ring-primary border-border rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <input
                            type="checkbox"
                            checked={item.isNo || false}
                            onChange={(e) => handleItemChange(index, 'isNo', e.target.checked)}
                            disabled={isViewOnly}
                            className="h-5 w-5 text-primary focus:ring-primary border-border rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <input
                            type="checkbox"
                            checked={item.isNA || false}
                            onChange={(e) => handleItemChange(index, 'isNA', e.target.checked)}
                            disabled={isViewOnly}
                            className="h-5 w-5 text-primary focus:ring-primary border-border rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">
                          <input
                            type="text"
                            value={item.comments || ''}
                            onChange={(e) => handleItemChange(index, 'comments', e.target.value)}
                            disabled={isViewOnly}
                            className="mt-1 focus:ring-primary focus:border-primary block w-full shadow-sm sm:text-sm border-input rounded-md bg-background px-3 py-2 border"
                            placeholder="Optional comments"
                          />
                        </td>
                        {!isViewOnly && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {index >= PREDEFINED_ITEMS.length && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-destructive hover:text-destructive/80 transition-colors p-1 rounded-full hover:bg-destructive/10"
                                aria-label="Remove item"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {!isViewOnly && (
                       <tr className="bg-muted/30">
                          <td colSpan={6} className="px-6 py-4 text-sm">
                             <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                <span className="font-medium whitespace-nowrap">Upload File (Optional)</span>
                                <input
                                  type="file"
                                  multiple
                                  onChange={handleFileChange}
                                  className="text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
                                />
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button
                                type="button"
                                onClick={handleAddCustomItem}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary whitespace-nowrap"
                             >
                                <Plus className="h-4 w-4 mr-1" /> Custom
                             </button>
                          </td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {isViewOnly && renderExistingFiles()}

            </div>
            {!isViewOnly && (
              <div className="bg-muted px-4 py-4 sm:px-6 flex flex-col sm:flex-row-reverse gap-3 border-t border-border">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Spot Check'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="w-full inline-flex justify-center rounded-md border border-border shadow-sm px-4 py-2 bg-background text-base font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:w-auto sm:text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
