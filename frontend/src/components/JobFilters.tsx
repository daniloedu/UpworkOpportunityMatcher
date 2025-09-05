import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, MapPin, Tag, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { getCategories } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

// Define the structure for a single filter
interface Filter {
  keywords: string;
  categories: string[];
  locations: string[];
  minBudget: string;
  maxBudget: string;
}

// Define the props for the JobFilters component
interface JobFiltersProps {
  onApplyFilters: (filters: Filter) => void;
  isFetching: boolean;
}

export const JobFilters = ({ onApplyFilters, isFetching }: JobFiltersProps) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    locations: true,
    budget: true,
  });

  const [keywords, setKeywords] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const { data: categories, isLoading: isLoadingCategories } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
    initialData: []
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleLocationChange = (locationId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleApplyFilters = () => {
    onApplyFilters({
      keywords,
      categories: selectedCategories,
      locations: selectedLocations,
      minBudget: "", // Placeholder for min budget
      maxBudget: "", // Placeholder for max budget
    });
  };

  const handleClearFilters = () => {
    setKeywords("");
    setSelectedCategories([]);
    setSelectedLocations([]);
    // Also clear other filters when they are implemented
    onApplyFilters({
      keywords: "",
      categories: [],
      locations: [],
      minBudget: "",
      maxBudget: "",
    });
  };

  const locations = [
    { id: "usa", label: "USA" },
    { id: "uk", label: "United Kingdom" },
    { id: "canada", label: "Canada" },
    { id: "australia", label: "Australia" },
    { id: "remote", label: "Remote Worldwide" },
  ];

  return (
    <Card className="shadow-soft flex flex-col h-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Tag className="h-5 w-5 text-primary" />
          <span>Filters</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 overflow-y-auto">
        {/* Keywords */}
        <div>
          <Label htmlFor="keywords" className="text-sm font-medium text-foreground">
            Keywords
          </Label>
          <Input
            id="keywords"
            placeholder="e.g. project management"
            className="mt-2"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>

        <Separator />

        {/* Categories */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection('categories')}
            className="w-full justify-between p-0 h-auto font-medium text-foreground hover:bg-transparent"
          >
            <span className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <span>Categories</span>
            </span>
            {expandedSections.categories ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {expandedSections.categories && (
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {isLoadingCategories ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
                </div>
              ) : (
                categories.map((category: any) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={category.id}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => handleCategoryChange(category.id)}
                    />
                    <Label
                      htmlFor={category.id}
                      className="flex-1 text-sm cursor-pointer hover:text-primary transition-smooth"
                    >
                      {category.label}
                    </Label>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Client Locations */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection('locations')}
            className="w-full justify-between p-0 h-auto font-medium text-foreground hover:bg-transparent"
          >
            <span className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Client Locations</span>
            </span>
            {expandedSections.locations ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {expandedSections.locations && (
            <div className="mt-3 space-y-2">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={location.id} 
                    checked={selectedLocations.includes(location.label)}
                    onCheckedChange={() => handleLocationChange(location.label)}
                  />
                  <Label
                    htmlFor={location.id}
                    className="flex-1 text-sm cursor-pointer hover:text-primary transition-smooth"
                  >
                    {location.label}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Budget Range */}
        <div>
          <Button
            variant="ghost"
            onClick={() => toggleSection('budget')}
            className="w-full justify-between p-0 h-auto font-medium text-foreground hover:bg-transparent"
          >
            <span className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Budget Range</span>
            </span>
            {expandedSections.budget ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {expandedSections.budget && (
            <div className="mt-3 space-y-3">
              <div className="flex space-x-2">
                <Input placeholder="Min" className="flex-1" />
                <Input placeholder="Max" className="flex-1" />
              </div>
              <div className="space-y-2">
                {["$0 - $25", "$25 - $50", "$50 - $100", "$100+"].map((range) => (
                  <div key={range} className="flex items-center space-x-2">
                    <Checkbox id={range} />
                    <Label
                      htmlFor={range}
                      className="text-sm cursor-pointer hover:text-primary transition-smooth"
                    >
                      {range}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <div className="flex space-x-2 w-full">
          <Button
            className="flex-1 bg-gradient-primary hover:opacity-90"
            onClick={handleApplyFilters}
            disabled={isFetching}
          >
            Apply Filters
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClearFilters}
            disabled={isFetching}
          >
            Clear All
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
